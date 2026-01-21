import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface TaskResponse {
  id: number;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  priority: TaskPriority;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface TaskListParams {
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface Page<T> {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  private readonly apiUrl = '/api/v1/tasks';

  constructor(private http: HttpClient) { }

  list(params: TaskListParams = {}): Observable<Page<TaskResponse>> {
    let httpParams = new HttpParams();

    if (params.assignedTo !== undefined) {
      httpParams = httpParams.set('assignedTo', params.assignedTo);
    }
    if (params.status !== undefined) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.priority !== undefined) {
      httpParams = httpParams.set('priority', params.priority);
    }
    if (params.dueDateFrom !== undefined) {
      httpParams = httpParams.set('dueDateFrom', params.dueDateFrom);
    }
    if (params.dueDateTo !== undefined) {
      httpParams = httpParams.set('dueDateTo', params.dueDateTo);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.sort !== undefined) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<Page<TaskResponse>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: TaskCreateRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.apiUrl, request);
  }

  update(id: number, request: TaskUpdateRequest): Observable<TaskResponse> {
    return this.http.patch<TaskResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  complete(id: number): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.apiUrl}/${id}/complete`, {});
  }

  uncomplete(id: number): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.apiUrl}/${id}/uncomplete`, {});
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/v1/users');
  }
}
