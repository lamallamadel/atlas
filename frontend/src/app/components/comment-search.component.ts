import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommentService, CommentSearchResult } from '../services/comment.service';

@Component({
  selector: 'app-comment-search',
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
