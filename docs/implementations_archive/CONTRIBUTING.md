# Contributing Guide

> **Statut**: Stable  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PROJECT_DOCUMENTATION_INDEX.md`

Thank you for your interest in contributing to this project! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We pledge to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the project and community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discriminatory language, or personal attacks
- Trolling, insulting comments, or unconstructive criticism
- Publishing others' private information without permission
- Any conduct that could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- Java 17 (JDK 17.0.5.8 or later)
- Maven 3.6+
- Node.js 18+ and npm
- Docker & Docker Compose
- Git

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/repository-name.git
   cd repository-name
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/repository-name.git
   ```

4. **Set up your development environment:**
   
   **Windows (PowerShell):**
   ```powershell
   $env:JAVA_HOME = 'C:\Environement\Java\jdk-17.0.5.8-hotspot'
   .\dev.ps1 up
   ```
   
   **Linux/Mac:**
   ```bash
   export JAVA_HOME=/path/to/jdk-17
   ./dev up
   ```

5. **Verify everything works:**
   - Backend: http://localhost:8080/actuator/health
   - Frontend: http://localhost:4200

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or modifications

### 2. Make Your Changes

- Keep changes focused and atomic
- Write clear, self-documenting code
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

**Backend:**
```bash
cd backend
mvn test
mvn spring-boot:run  # Manual testing
```

**Frontend:**
```bash
cd frontend
npm test
npm start  # Manual testing
```

**Full Stack:**
```bash
./dev up
# Test the full application
./dev down
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add user authentication endpoint"
```

**Commit message format:**
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat: add password reset functionality

Implements password reset flow with email verification.
- Add password reset endpoint
- Create email template
- Add validation logic

Closes #123
```

```
fix: resolve null pointer exception in user service

The getUserById method was not handling null values correctly.
Added null checks and appropriate error responses.
```

### 5. Keep Your Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

If there are conflicts, resolve them and continue:

```bash
# Fix conflicts in your editor
git add .
git rebase --continue
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

## 📝 Coding Standards

### Backend (Java)

- Follow Spring Boot conventions
- Use meaningful variable and method names
- Keep methods small and focused (Single Responsibility Principle)
- Use proper exception handling
- Add JavaDoc for public APIs
- Use `@Service`, `@Repository`, `@Controller` annotations appropriately

**Example:**
```java
@Service
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Retrieves a user by ID.
     *
     * @param id the user ID
     * @return the user
     * @throws UserNotFoundException if user not found
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}
```

### Frontend (TypeScript/Angular)

- Follow Angular style guide
- Use TypeScript strict mode
- Use reactive programming (RxJS) appropriately
- Component structure: template, style, TypeScript file
- Keep components small and focused
- Use proper typing (avoid `any`)

**Example:**
```typescript
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]>;
  
  constructor(private userService: UserService) {}
  
  ngOnInit(): void {
    this.users$ = this.userService.getUsers();
  }
}
```

### General Principles

- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- Write code that is easy to read and maintain
- Prefer composition over inheritance
- Use dependency injection

## 🧪 Testing

### Backend Tests

Write unit tests for services and integration tests for controllers:

```java
@SpringBootTest
class UserServiceTest {
    
    @Autowired
    private UserService userService;
    
    @MockBean
    private UserRepository userRepository;
    
    @Test
    void getUserById_WhenUserExists_ReturnsUser() {
        // Arrange
        User user = new User(1L, "John");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        // Act
        User result = userService.getUserById(1L);
        
        // Assert
        assertEquals("John", result.getName());
    }
}
```

**Run tests:**
```bash
cd backend
mvn test
```

### Frontend Tests

Write unit tests for components and services:

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch users', () => {
    const mockUsers = [{ id: 1, name: 'John' }];
    
    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });
    
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

**Run tests:**
```bash
cd frontend
npm test
```

### Test Coverage

- Aim for at least 80% code coverage
- Focus on testing business logic
- Write tests before fixing bugs (TDD approach recommended)
- Integration tests for critical user flows

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow the convention
- [ ] Branch is up-to-date with main

### Submitting a Pull Request

1. **Push your branch** to your fork

2. **Open a Pull Request** on GitHub
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Reference related issues (e.g., "Closes #123")
   - Add screenshots/GIFs for UI changes

3. **Respond to feedback**
   - Address reviewer comments promptly
   - Make requested changes in new commits
   - Keep the conversation professional and constructive

4. **Wait for approval**
   - At least one approval required
   - All CI checks must pass
   - No merge conflicts

### PR Title Format

Follow the same convention as commit messages:

```
feat: add user authentication
fix: resolve memory leak in data service
docs: update API documentation
```

### After Merge

1. **Delete your branch** (optional but recommended)
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your local repository**
   ```bash
   git checkout main
   git pull upstream main
   ```

## 🐛 Issue Guidelines

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check if it's already fixed in the latest version
- Gather relevant information (logs, screenshots, etc.)

### Bug Reports

Use the bug report template and include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, browser, versions)
- Logs and error messages
- Screenshots/videos (if applicable)

### Feature Requests

Use the feature request template and include:

- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Alternative solutions considered

### Questions

- Use the question template
- Check documentation first
- Provide context about what you're trying to achieve
- Include relevant code snippets

## 📞 Getting Help

If you need help:

1. Check the [README.md](../README.md) and documentation
2. Search existing issues and discussions
3. Ask in the project's discussion forum/chat
4. Create a question issue if needed

## 🎉 Recognition

Contributors are recognized in several ways:

- Listed in the project's contributors
- Mentioned in release notes for significant contributions
- Credit in documentation for major features

Thank you for contributing! 🙌
