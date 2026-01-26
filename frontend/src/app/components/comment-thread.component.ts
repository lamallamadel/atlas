import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommentService, CommentEntityType, CommentThread, CreateThreadRequest, CreateCommentRequest } from '../services/comment.service';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@Component({
  selector: 'app-comment-thread',
  templateUrl: './comment-thread.component.html',
  styleUrls: ['./comment-thread.component.css']
})
export class CommentThreadComponent implements OnInit {
  @Input() entityType!: CommentEntityType;
  @Input() entityId!: number;
  @ViewChild('commentInput') commentInput!: ElementRef<HTMLTextAreaElement>;

  threads: CommentThread[] = [];
  selectedThread: CommentThread | null = null;
  showNewThreadForm = false;
  showResolvedThreads = false;
  
  newThreadForm: FormGroup;
  newCommentForm: FormGroup;
  
  users: string[] = [];
  filteredUsers: string[] = [];
  showMentionDropdown = false;
  mentionCursorPosition = 0;
  currentMentionQuery = '';

  loading = false;
  unresolvedCount = 0;

  constructor(
    private commentService: CommentService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.newThreadForm = this.fb.group({
      title: [''],
      initialComment: ['', Validators.required]
    });

    this.newCommentForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadThreads();
    this.loadUnresolvedCount();
    this.loadUsers();
  }

  loadThreads(): void {
    this.loading = true;
    this.commentService.getThreadsForEntity(this.entityType, this.entityId)
      .subscribe({
        next: (threads) => {
          this.threads = threads;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading threads:', error);
          this.snackBar.open('Failed to load comment threads', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  loadUnresolvedCount(): void {
    this.commentService.countUnresolvedThreads(this.entityType, this.entityId)
      .subscribe({
        next: (count) => {
          this.unresolvedCount = count;
        },
        error: (error) => {
          console.error('Error loading unresolved count:', error);
        }
      });
  }

  loadUsers(): void {
    this.users = ['admin', 'user1', 'user2', 'john', 'jane', 'robert', 'sarah'];
  }

  get visibleThreads(): CommentThread[] {
    if (this.showResolvedThreads) {
      return this.threads;
    }
    return this.threads.filter(t => !t.resolved);
  }

  createNewThread(): void {
    if (this.newThreadForm.invalid) {
      return;
    }

    const request: CreateThreadRequest = {
      entityType: this.entityType,
      entityId: this.entityId,
      title: this.newThreadForm.value.title || undefined,
      initialComment: this.newThreadForm.value.initialComment
    };

    this.commentService.createThread(request).subscribe({
      next: (thread) => {
        this.threads.unshift(thread);
        this.newThreadForm.reset();
        this.showNewThreadForm = false;
        this.unresolvedCount++;
        this.snackBar.open('Thread created successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error creating thread:', error);
        this.snackBar.open('Failed to create thread', 'Close', { duration: 3000 });
      }
    });
  }

  selectThread(thread: CommentThread): void {
    this.selectedThread = thread;
    this.newCommentForm.reset();
  }

  addComment(): void {
    if (!this.selectedThread || this.newCommentForm.invalid) {
      return;
    }

    const content = this.newCommentForm.value.content;
    const mentions = this.extractMentions(content);

    const request: CreateCommentRequest = {
      threadId: this.selectedThread.id,
      content: content,
      mentions: mentions
    };

    this.commentService.addComment(request).subscribe({
      next: (comment) => {
        if (this.selectedThread) {
          this.selectedThread.comments.push(comment);
          this.newCommentForm.reset();
          this.snackBar.open('Comment added successfully', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.snackBar.open('Failed to add comment', 'Close', { duration: 3000 });
      }
    });
  }

  resolveThread(thread: CommentThread): void {
    this.commentService.resolveThread(thread.id).subscribe({
      next: (updatedThread) => {
        const index = this.threads.findIndex(t => t.id === thread.id);
        if (index !== -1) {
          this.threads[index] = updatedThread;
          if (this.selectedThread?.id === thread.id) {
            this.selectedThread = updatedThread;
          }
          this.unresolvedCount--;
          this.snackBar.open('Thread marked as resolved', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error resolving thread:', error);
        this.snackBar.open('Failed to resolve thread', 'Close', { duration: 3000 });
      }
    });
  }

  unresolveThread(thread: CommentThread): void {
    this.commentService.unresolveThread(thread.id).subscribe({
      next: (updatedThread) => {
        const index = this.threads.findIndex(t => t.id === thread.id);
        if (index !== -1) {
          this.threads[index] = updatedThread;
          if (this.selectedThread?.id === thread.id) {
            this.selectedThread = updatedThread;
          }
          this.unresolvedCount++;
          this.snackBar.open('Thread reopened', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error unresolving thread:', error);
        this.snackBar.open('Failed to reopen thread', 'Close', { duration: 3000 });
      }
    });
  }

  deleteThread(thread: CommentThread): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Delete Comment Thread',
        message: 'Are you sure you want to delete this thread and all its comments? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.commentService.deleteThread(thread.id).subscribe({
          next: () => {
            this.threads = this.threads.filter(t => t.id !== thread.id);
            if (this.selectedThread?.id === thread.id) {
              this.selectedThread = null;
            }
            if (!thread.resolved) {
              this.unresolvedCount--;
            }
            this.snackBar.open('Thread deleted successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting thread:', error);
            this.snackBar.open('Failed to delete thread', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  exportThread(thread: CommentThread, format: 'text' | 'csv' = 'text'): void {
    this.commentService.exportThread(thread.id, format).subscribe({
      next: (blob) => {
        const ext = format === 'csv' ? 'csv' : 'txt';
        this.commentService.downloadFile(blob, `comment-thread-${thread.id}.${ext}`);
        this.snackBar.open('Thread exported successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error exporting thread:', error);
        this.snackBar.open('Failed to export thread', 'Close', { duration: 3000 });
      }
    });
  }

  exportAllThreads(): void {
    this.commentService.exportAllThreadsForEntity(this.entityType, this.entityId).subscribe({
      next: (blob) => {
        this.commentService.downloadFile(blob, `comments-${this.entityType.toLowerCase()}-${this.entityId}.txt`);
        this.snackBar.open('All threads exported successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error exporting threads:', error);
        this.snackBar.open('Failed to export threads', 'Close', { duration: 3000 });
      }
    });
  }

  onCommentInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const content = target.value;
    const cursorPosition = target.selectionStart;
    
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      if (!textAfterAt.includes(' ') && textAfterAt.length > 0) {
        this.currentMentionQuery = textAfterAt.toLowerCase();
        this.mentionCursorPosition = cursorPosition;
        this.filteredUsers = this.users.filter(user => 
          user.toLowerCase().startsWith(this.currentMentionQuery)
        );
        this.showMentionDropdown = this.filteredUsers.length > 0;
      } else {
        this.showMentionDropdown = false;
      }
    } else {
      this.showMentionDropdown = false;
    }
  }

  selectMention(user: string): void {
    if (!this.commentInput) return;
    
    const textarea = this.commentInput.nativeElement;
    const content = textarea.value;
    const cursorPosition = this.mentionCursorPosition;
    
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = content.substring(cursorPosition);
    
    const newContent = content.substring(0, lastAtIndex) + '@' + user + ' ' + textAfterCursor;
    
    this.newCommentForm.patchValue({ content: newContent });
    this.showMentionDropdown = false;
    
    setTimeout(() => {
      const newCursorPos = lastAtIndex + user.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      if (!mentions.includes(match[1])) {
        mentions.push(match[1]);
      }
    }
    
    return mentions;
  }

  toggleNewThreadForm(): void {
    this.showNewThreadForm = !this.showNewThreadForm;
    if (!this.showNewThreadForm) {
      this.newThreadForm.reset();
    }
  }

  toggleResolvedThreads(): void {
    this.showResolvedThreads = !this.showResolvedThreads;
  }

  formatComment(content: string): string {
    return content.replace(/@(\w+)/g, '<span class="mention">@$1</span>')
                  .replace(/\n/g, '<br>');
  }
}
