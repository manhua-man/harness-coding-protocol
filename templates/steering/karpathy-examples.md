# Karpathy Coding Principles (Detailed Examples)

> Andrej Karpathy's observations on LLM coding behavior + real code correction examples.  
> This file is supplementary under **steering/** and reference-only by default. It does not become mandatory protocol merely because it exists. Core decisions follow the target repository's `CLAUDE.md`.

---

## Common Problems

> "Models make wrong assumptions for the user, then follow through without checking. They don't manage their own confusion, don't seek clarification, don't present trade-offs, don't push back when they should."

> "They really like to over-complicate code and APIs, inflate abstractions, not clean up dead code... implementing a 1000-line bloated structure when 100 lines would do."

---

## Coding Principles

| Principle | Problem Addressed |
| --- | --- |
| **Think Before Coding** | Wrong assumptions, hidden confusion, missing trade-offs |
| **Simplicity First** | Over-complexity, bloated abstractions, poor readability |
| **Surgical Changes** | Orthogonal edits, touching code that shouldn't change |
| **Goal-Driven Execution** | Test-first, verifiable success criteria |
| **Explicit Dependencies** | Implicit state, magic dependencies, untestable code |

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface trade-offs.**

- **State assumptions explicitly** — if unsure, ask rather than guess
- **Present multiple interpretations** — when ambiguous, don't silently pick one
- **Push back when needed** — if a simpler approach exists, say so
- **Stop when confused** — name what's unclear and ask for clarification

### Hidden Assumptions

**User request:** "Add a feature to export user data"

**❌ Wrong:** Implicitly assume scope, fields, format

```python
def export_users(format='json'):
    users = User.query.all()
    if format == 'json':
        with open('users.json', 'w') as f:
            json.dump([u.to_dict() for u in users], f)
    elif format == 'csv':
        with open('users.csv', 'w') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'email', 'name'])
            writer.writeheader()
            writer.writerows([u.to_dict() for u in users])
    return f"Exported {len(users)} users"
```

Implicitly assumed: export all users (pagination? privacy?), file location, which fields, CSV column names.

**✅ Correct:** Clarify before implementing

```
Before implementing, I need to clarify:

1. **Scope**: Export all users or filtered subset? (privacy implications)
2. **Format**: Did you mean:
   - Download file in browser?
   - Background job with email notification?
   - API endpoint returning data?
3. **Fields**: Which user fields? (some might be sensitive)
4. **Volume**: How many users typically? (affects approach)

What's your preference?
```

### Multiple Interpretations

**User request:** "Make search faster"

**❌ Wrong:** Silently pick one approach

```python
@lru_cache(maxsize=1000)
async def search(query: str) -> List[Result]:
    # ... 200 lines of optimization code
```

**✅ Correct:** Present options and trade-offs

```
"Make the search faster" could mean:

1. **Faster response time** (< 100ms instead of 500ms)
   - Add database indexes / Cache frequent queries
   - Estimated effort: 2 hours

2. **Handle more concurrent searches** (throughput)
   - Add async/await / Connection pooling
   - Estimated effort: 4 hours

3. **Faster perceived speed** (UX)
   - Show partial results immediately / Progressive loading
   - Estimated effort: 3 hours

Current search takes ~500ms for typical queries.
Which aspect matters most for your use case?
```

---

## 2. Simplicity First

**Minimum code to solve the problem. No speculative code. Readability first.**

- Don't add features beyond requirements
- Don't create abstractions for one-off code
- Don't add unrequested "flexibility" or "configurability"
- Don't add error handling for impossible scenarios
- If 200 lines can become 50, rewrite
- Avoid cleverness; prefer readability over tricks

**Check:** Would a senior engineer say this is too complex? Simplify.

### Over-Abstraction

**User request:** "Add a function to calculate discount"

**❌ Wrong:** Strategy pattern for simple discount (over-engineering)

```python
from abc import ABC, abstractmethod
from enum import Enum
from typing import Protocol, Union
from dataclasses import dataclass

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, amount: float) -> float:
        pass

class PercentageDiscount(DiscountStrategy):
    def __init__(self, percentage: float):
        self.percentage = percentage
    def calculate(self, amount: float) -> float:
        return amount * (self.percentage / 100)

# ... 100+ lines for a simple discount calculation
```

**✅ Correct:** One function

```python
def calculate_discount(amount: float, percent: float) -> float:
    """Calculate discount amount. percent should be 0-100."""
    return amount * (percent / 100)

# Usage
discount = calculate_discount(100.0, 10.0)  # $10 off
```

Add complexity only when you truly need multiple discount types.

### Speculative Features

**User request:** "Save user preferences to the database"

**❌ Wrong:** Add caching, validation, notifications "for future use"

```python
class PreferenceManager:
    def __init__(self, db, cache=None, validator=None):
        self.cache = cache or InMemoryCache()
        self.validator = validator or DefaultValidator()

    def save(self, user_id: int, prefs: dict,
             merge: bool = True,
             validate: bool = True,
             notify: bool = False) -> bool:
        # ... 50+ lines with caching, validation, notifications
```

**✅ Correct:** Do what was asked; add later as needed

```python
def save_preferences(db, user_id: int, preferences: dict):
    """Save user preferences to database."""
    db.execute(
        "UPDATE users SET preferences = ? WHERE id = ?",
        (json.dumps(preferences), user_id)
    )
```

### Clarity Over Cleverness

Avoid complex TypeScript advanced features, tricky decorators, or implicit magic unless they are the simplest solution.

**❌ Wrong:** Rewrite simple property access with Proxy + Reflect  
**✅ Correct:** Direct `obj.key` read/write

**❌ Wrong:** Rewrite simple sequential calls with compose/pipe combinators  
**✅ Correct:** Call in order; reads like natural language

### Avoid Premature Abstraction

Don't build complex decorators, interceptors, or mixins unless they clearly solve **at least two existing, immediate problems**.

YAGNI (You Ain't Gonna Need It): don't implement features not required by a failing test today.

**❌ Wrong:** Three functions share code → immediately abstract to base class  
**✅ Correct:** Confirm repetition will persist, then extract; handle the first case on its own

**❌ Wrong:** "This will be reused later" — pre-extract utils to `utils/`  
**✅ Correct:** Extract when a second real use appears

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting
- Don't refactor what isn't broken
- Match existing style even if you'd do it differently
- If you notice unrelated dead code, mention it — don't delete it

Orphans from your changes:

- Remove imports/variables/functions made unused by your change
- Don't remove pre-existing dead code unless asked

**Check:** Every changed line should trace to the user's request.

### Drive-By Refactor

**User request:** "Fix bug where validator crashes on empty email"

**❌ Wrong:** Fix bug while improving other code

```diff
  def validate_user(user_data):
-     # Check email format
-     if not user_data.get('email'):
+     """Validate user data."""
+     email = user_data.get('email', '').strip()
+
+     # Validate email
+     if not email:
          raise ValueError("Email required")
-     # Basic email validation
-     if '@' not in user_data['email']:
+     if '@' not in email or '.' not in email.split('@')[1]:
          raise ValueError("Invalid email")
-     # Check username
-     if not user_data.get('username'):
+     # Validate username
+     username = user_data.get('username', '').strip()
+     if not username:
          raise ValueError("Username required")
+     if len(username) < 3:
+         raise ValueError("Username too short")
+     if not username.isalnum():
+         raise ValueError("Username must be alphanumeric")
      return True
```

**✅ Correct:** Change only what's needed for the bug

```diff
  def validate_user(user_data):
      # Check email format
-     if not user_data.get('email'):
+     email = user_data.get('email', '')
+     if not email or not email.strip():
          raise ValueError("Email required")
      # Basic email validation
-     if '@' not in user_data['email']:
+     if '@' not in email:
          raise ValueError("Invalid email")
      # Check username
      if not user_data.get('username'):
          raise ValueError("Username required")
      return True
```

### Style Drift

**User request:** "Add logging to upload function"

**❌ Wrong:** Change quote style, add type hints, reorder whitespace while adding logs

```diff
- def upload_file(file_path, destination):
+ def upload_file(file_path: str, destination: str) -> bool:
+     """Upload file to destination with logging."""
+     logger.info(f"Uploading {file_path} to {destination}")
+
      try:
-         with open(file_path, 'rb') as f:
-             data = f.read()
-         response = requests.post(destination, files={'file': data})
-         if response.status_code == 200:
-             return True
-         else:
-             return False
+         with open(file_path, "rb") as f:
+             data = f.read()
+         response = requests.post(destination, files={"file": data})
+         success = response.status_code == 200
+         if success:
+             logger.info(f"Upload successful: {file_path}")
+         else:
+             logger.error(f"Upload failed: status={response.status_code}")
+         return success
      except Exception as e:
-         print(f"Error: {e}")
+         logger.exception(f"Upload error for {file_path}: {e}")
          return False
```

**✅ Correct:** Match existing style (single quotes, no type hints, existing boolean pattern)

```diff
+ import logging
+
+ logger = logging.getLogger(__name__)
+
  def upload_file(file_path, destination):
+     logger.info(f'Starting upload: {file_path}')
      try:
          with open(file_path, 'rb') as f:
              data = f.read()
          response = requests.post(destination, files={'file': data})
          if response.status_code == 200:
+             logger.info(f'Upload successful: {file_path}')
              return True
          else:
+             logger.error(f'Upload failed: {file_path}, status={response.status_code}')
              return False
      except Exception as e:
-         print(f"Error: {e}")
+         logger.exception(f'Upload error: {file_path}')
          return False
```

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Turn imperative tasks into verifiable goals:

| Don't... | Turn into... |
| --- | --- |
| "Add validation" | "Write tests for invalid input first, then make them pass" |
| "Fix bug" | "Write a test that reproduces it, then make the test pass" |
| "Refactor X" | "Ensure tests pass before and after refactor" |

For multi-step tasks, declare a brief plan:

```
1. [step] → verify: [check]
2. [step] → verify: [check]
3. [step] → verify: [check]
```

### Vague vs Verifiable

**User request:** "Fix the authentication system"

**❌ Wrong:** Vague approach

```
I'll fix the authentication system by:
1. Reviewing the code
2. Identifying issues
3. Making improvements
4. Testing the changes
```

**✅ Correct:** Verifiable goals

```
To "fix authentication," I need to define success criteria.
What specific issue are we solving?

If the issue is "users stay logged in after password change":

Plan:
1. Write test: Change password → verify old session invalidated
   Verify: Test fails (reproduces bug)

2. Implement: Invalidate sessions on password change
   Verify: Test passes

3. Check edge cases: Multiple active sessions, concurrent changes
   Verify: Additional tests pass

4. Verify no regression: Existing auth tests still pass
   Verify: Full test suite green

Current test coverage for auth: [shows coverage]
What's the specific auth issue you're seeing?
```

### Multi-Step Verification

**User request:** "Add rate limiting to the API"

**❌ Wrong:** Do everything at once without verification steps

```python
# Implements full rate limiting with Redis, multiple strategies,
# configuration system, and monitoring in one 300-line commit
# No clear verification steps
```

**✅ Correct:** Incremental + verification

```
Plan for rate limiting:

1. Add basic in-memory rate limiting (single endpoint)
   Verify:
   - Test: 100 requests → first 10 succeed, rest get 429
   - Manual: curl endpoint 11 times, see rate limit error

2. Extract to middleware (apply to all endpoints)
   Verify:
   - Test: Rate limits apply to /users and /posts
   - Existing endpoint tests still pass

3. Add Redis backend (for multi-server)
   Verify:
   - Test: Rate limit persists across app restarts
   - Test: Two app instances share rate limit counter

4. Add configuration (rates per endpoint)
   Verify:
   - Test: /search allows 10/min, /users allows 100/min
   - Config file parsed correctly

Each step is independently verifiable and deployable.
Start with step 1?
```

### Test-First Verification

**User request:** "Sorting breaks when scores are duplicated"

**❌ Wrong:** Fix without reproducing

```python
# Immediately changes sort logic without confirming the bug
def sort_scores(scores):
    return sorted(scores, key=lambda x: (-x['score'], x['name']))
```

**✅ Correct:** Write a reproducing test first

```python
# 1. First, write a test that reproduces the issue
def test_sort_with_duplicate_scores():
    """Test sorting when multiple items have same score."""
    scores = [
        {'name': 'Alice', 'score': 100},
        {'name': 'Bob', 'score': 100},
        {'name': 'Charlie', 'score': 90},
    ]
    result = sort_scores(scores)
    # The bug: order is non-deterministic for duplicates
    assert result[0]['score'] == 100
    assert result[1]['score'] == 100
    assert result[2]['score'] == 90

# Verify: Run test 10 times → fails with inconsistent ordering

# 2. Now fix with stable sort
def sort_scores(scores):
    """Sort by score descending, then name ascending for ties."""
    return sorted(scores, key=lambda x: (-x['score'], x['name']))

# Verify: Test passes consistently
```

### Design for Testability

**❌ Wrong:** Service does `new ExternalService()` inside `constructor()`, can't mock  
**✅ Correct:** Dependencies injected via constructor, easy to mock and replace

---

## 5. Explicit Dependencies

**Dependencies and data flow must be explicit. Avoid implicit state and magic behavior.**

- Use types for function signatures and class properties
- Avoid hidden state or implicit context passing
- Avoid implicit dependencies (globals, magic constants, direct env var reads)
- Prefer dependency injection over direct instantiation

### Implicit `this` State

**User request:** "Add audit logging to user service"

**❌ Wrong:** Hang undeclared data on class; access by runtime convention

```typescript
class UserService {
  // Implicit dependency: auditLog injected by runtime convention
  async createUser(data: CreateUserDto) {
    // Depends on this.auditLog existing, but types can't enforce it
    this.auditLog.log('user.created', data);
    return this.userRepo.save(data);
  }
}
```

**✅ Correct:** Pass data as parameters or from explicit sources

```typescript
class UserService {
  constructor(
    private userRepo: UserRepository,
    private auditLog: AuditLogger, // explicit dependency, type-safe
  ) {}

  async createUser(data: CreateUserDto) {
    this.auditLog.log('user.created', data);
    return this.userRepo.save(data);
  }
}
```

### Global State Implicit Dependency

**User request:** "Implement email sending"

**❌ Wrong:** Function reads env vars internally; implicit global dependency

```python
def send_email(to: str, subject: str, body: str):
    # Implicit dependency on process.env.API_KEY, nowhere declared
    api_key = process.env.API_KEY
    client = EmailClient(api_key)
    return client.send(to, subject, body)
```

**✅ Correct:** Config passed as parameter; source clear and traceable

```python
def send_email(to: str, subject: str, body: str, config: EmailConfig):
    # config.api_key passed explicitly; caller owns source
    client = EmailClient(config.api_key)
    return client.send(to, subject, body)
```

### Implicit Dependency Creation

**User request:** "Add HTTP client to fetch user details"

**❌ Wrong:** Instantiate HTTP client inside function; can't mock

```python
def get_user(user_id: int) -> User:
    # Implicit HTTP client dependency, can't replace
    response = requests.get(f'https://api.example.com/users/{user_id}')
    return User.parse_obj(response.json())
```

**✅ Correct:** Inject via parameter for test and replacement

```python
def get_user(user_id: int, http_client: HttpClient = None) -> User:
    client = http_client or requests  # supports injecting default impl
    response = client.get(f'https://api.example.com/users/{user_id}')
    return User.parse_obj(response.json())

# Easy to mock in tests
def test_get_user():
    mock_client = MockHttpClient(user_data={'id': 1, 'name': 'Alice'})
    user = get_user(1, http_client=mock_client)
    assert user.name == 'Alice'
```

---

## Anti-Pattern Summary

| Principle | Anti-pattern | Fix |
| --- | --- | --- |
| Think Before Coding | Silently assume format, fields, scope | List assumptions; ask for clarification |
| Simplicity First | Strategy pattern for single discount | One function until complexity is truly needed |
| Surgical Changes | Requote, add types, fix unrelated errors | Change only lines that fix the reported issue |
| Goal-Driven Execution | "I'll review and improve the code" | "Write test for gap X → make it pass → verify no regression" |
| Explicit Dependencies | Implicit `this` data, direct env reads | Pass via parameters/DI with type constraints |

---

## Key Insight

**"Too complex" examples aren't obviously wrong** — they follow design patterns and best practices. The problem is **timing**: complexity added before it's needed.

That leads to:

- Harder-to-understand code
- More bugs
- Longer implementation
- Harder testing

**The "simple" version has:**

- Easier understanding
- Faster implementation
- Easier testing
- Room to refactor when complexity is actually needed

**Good code solves today's problem simply, not tomorrow's problem prematurely.**

---

## Trade-off Note

These principles bias toward **caution over speed**. For trivial tasks (simple typo fix, obvious one-liner), use judgment — not every change needs the full process. The goal is fewer high-cost mistakes in non-trivial work, not slowing simple tasks.

---

## Success Criteria

When these principles work, you'll see:

- Fewer unnecessary changes in diffs
- Fewer rewrites from over-complication
- Clarifying questions before implementation, not after errors
- Clean, minimal PRs — no drive-by refactors or "improvements"

---

**Usage in this project**

- Adapt examples to real project paths, assets, risks, and invariants before relying on them.
- Combine with **Decision Priority** and any risk-tiered RIPER Gate in `CLAUDE.md`.
- Treat `m5-engineering-principles.md` as a sibling, independently selectable reference when present.
- Treat matching project-specific `steering/` rules as more specific than these generic examples.
