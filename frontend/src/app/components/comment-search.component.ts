import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';
import { CommentService, CommentSearchResult } from '../services/comment.service';
import { DsSkeletonComponent } from '../design-system/primitives/ds-skeleton/ds-skeleton.component';

@Component({
  selector: 'app-comment-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    MatIcon,
    MatButton,
    MatIconButton,
    MatChip,
    DsSkeletonComponent,
  ],
  templateUrl: './comment-search.component.html',
  styleUrls: ['./comment-search.component.css']
})
export class CommentSearchComponent {
  searchForm: FormGroup;
  searchResults: CommentSearchResult[] = [];
  searching = false;

  constructor(
    private commentService: CommentService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      query: ['']
    });
  }

  search(): void {
    const query = this.searchForm.value.query?.trim();
    if (!query) {
      return;
    }

    this.searching = true;
    this.commentService.searchComments(query).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.searching = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searching = false;
      }
    });
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.searchResults = [];
  }

  highlightQuery(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
