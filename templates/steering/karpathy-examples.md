# Karpathy 编码原则（详细示例）

> 编码原则的真实代码示例，展示 LLM 常见错误及修正方法。

---

## 常见问题

> "模型会替用户做出错误假设，然后跟着执行而不检查。它们不管理自己的困惑，不寻求澄清，不呈现权衡，不在应该反驳时反驳。"

> "它们真的喜欢过度复杂化代码和API，膨胀抽象，不清理死代码...实现了1000行的臃肿结构，而100行就够了。"

---

## 编码原则

| 原则 | 解决的问题 |
|------|-----------|
| **Think Before Coding** | 错误假设、隐藏困惑、缺失权衡 |
| **Simplicity First** | 过度复杂、臃肿抽象、可读性差 |
| **Surgical Changes** | 正交编辑、触碰不该改的代码 |
| **Goal-Driven Execution** | 测试优先、可验证成功标准 |
| **Explicit Dependencies** | 隐式状态、魔法依赖、不可测试 |

---

## 1. Think Before Coding（三思而后行）

**不要假设。不要隐藏困惑。表面权衡。**

- **显式声明假设** — 如果不确定，先问而非猜测
- **呈现多种解释** — 存在歧义时不要静默选择
- **在必要时反驳** — 如果存在更简单的方案，说出来
- **困惑时停止** — 说出不清楚的地方，请求澄清

### 隐藏假设

**用户请求：** "添加导出用户数据的功能"

**❌ 错误：** 隐式假设范围、字段、格式

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

隐式假设了：应导出所有用户（分页？隐私？）、文件位置、包含哪些字段、CSV字段名。

**✅ 正确：** 先问清楚再实现

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

### 多重解释

**用户请求：** "加快搜索速度"

**❌ 错误：** 悄无声息地选择一个方案

```python
@lru_cache(maxsize=1000)
async def search(query: str) -> List[Result]:
    # ... 200 lines of optimization code
```

**✅ 正确：** 呈现多种方案及其权衡

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

## 2. Simplicity First（简洁优先）

**最小代码解决问题。没有投机性代码。可读性优先。**

- 不添加超出需求的功能
- 不为单次使用的代码创建抽象
- 不添加没有被要求的"灵活性"或"可配置性"
- 不为不可能的场景添加错误处理
- 如果200行能变成50行，重写它
- 避免炫技式写法，优先可读性而非技巧性

**检验：** 如果资深工程师说这个太复杂了？简化它。

### 过度抽象

**用户请求：** "添加计算折扣的函数"

**❌ 错误：** 用策略模式做简单折扣计算（过度工程）

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

**✅ 正确：** 一个函数搞定

```python
def calculate_discount(amount: float, percent: float) -> float:
    """Calculate discount amount. percent should be 0-100."""
    return amount * (percent / 100)

# Usage
discount = calculate_discount(100.0, 10.0)  # $10 off
```

何时增加复杂度：只有当你真正需要多种折扣类型时才会这样。

### 推测性特征

**用户请求：** "将用户偏好保存到数据库"

**❌ 错误：** 添加缓存、验证、通知等"未来可能用到"的功能

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

**✅ 正确：** 只做被要求的，后续按需添加

```python
def save_preferences(db, user_id: int, preferences: dict):
    """Save user preferences to database."""
    db.execute(
        "UPDATE users SET preferences = ? WHERE id = ?",
        (json.dumps(preferences), user_id)
    )
```

后续按需添加：缓存（性能重要时）、验证（出现不良数据时）、合并（需求出现时）。

### Clarity Over Cleverness（可读性优先）

避免复杂 TypeScript 高级特性、tricky 装饰器、或隐式魔法行为，除非它们代表最简单的解决方案。

**❌ 错误：** 用 Proxy + Reflect 重写一个简单的取值逻辑
**✅ 正确：** 直接 `obj.key` 读写

**❌ 错误：** 用复杂的函数组合子（compose/pipe）改写简单的顺序调用
**✅ 正确：** 按顺序调用，看起来像读自然语言

### Avoid Premature Abstraction（避免过早抽象）

除非能明确解决**至少两个现有、即时的问题**，否则不构建复杂的装饰器、拦截器或 Mixin。

YAGNI (You Ain't Gonna Need It)：不实现尚未被当前失败测试要求的功能。

**❌ 错误：** 三个不同函数有重复代码，立刻抽象成基类
**✅ 正确：** 确认重复会持续出现，再提炼；第一次出现只管它本身

**❌ 错误：** "这个以后会复用"——预先抽取工具函数到 `utils/`
**✅ 正确：** 等第二个地方真正用到再提炼

---

## 3. Surgical Changes（手术式改动）

**只触碰必须改的。只清理自己造成的混乱。**

编辑现有代码时：
- 不要"改进"相邻的代码、注释或格式
- 不要重构没有坏的东西
- 匹配现有风格，即使你会用不同方式
- 如果注意到无关的死代码，提出来 — 不要删除它

你的改动造成的孤儿：
- 移除因你的改动而变得未使用的 import/变量/函数
- 不要移除之前就存在的死代码，除非被要求

**检验：** 每行改动都应该能追溯到用户的请求。

### 顺便重构

**用户请求：** "修复空邮件导致验证器崩溃的bug"

**❌ 错误：** 修复 bug 时顺便改进其他代码

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

问题："改进了"邮件验证（超出范围）、添加了没人要求的用户名验证、改了注释、添加了文档字符串。

**✅ 正确：** 只改解决 bug 必需的

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

### 风格漂移

**用户请求：** "给上传函数添加日志"

**❌ 错误：** 添加日志时顺便改引号风格、添类型提示、重排空格

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

**✅ 正确：** 匹配现有风格（单引号、无类型提示、现有布尔模式）

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

## 4. Goal-Driven Execution（目标驱动执行）

**定义成功标准。循环直到验证。**

把命令式任务转化为可验证目标：

| 不要... | 转化为... |
|--------|-----------|
| "添加验证" | "先写无效输入的测试，然后让它们通过" |
| "修复bug" | "先写能复现它的测试，然后让测试通过" |
| "重构X" | "确保重构前后测试都通过" |

多步骤任务要声明简要计划：

```
1. [步骤] → 验证: [检查项]
2. [步骤] → 验证: [检查项]
3. [步骤] → 验证: [检查项]
```

### 模糊 vs 可验证

**用户请求：** "修复认证系统"

**❌ 错误：** 模糊方法

```
I'll fix the authentication system by:
1. Reviewing the code
2. Identifying issues
3. Making improvements
4. Testing the changes
```

**✅ 正确：** 可验证目标

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

### 多步骤验证

**用户请求：** "给API添加限流"

**❌ 错误：** 一次全做，不声明验证步骤

```python
# Implements full rate limiting with Redis, multiple strategies,
# configuration system, and monitoring in one 300-line commit
# No clear verification steps
```

**✅ 正确：** 增量+验证

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

### 测试优先验证

**用户请求：** "排序在有重复分数时出问题"

**❌ 错误：** 不复现就修

```python
# Immediately changes sort logic without confirming the bug
def sort_scores(scores):
    return sorted(scores, key=lambda x: (-x['score'], x['name']))
```

**✅ 正确：** 先写能复现的测试

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

### Design for Testability（可测试性）

**❌ 错误：** Service 在 `constructor()` 里直接 `new ExternalService()`，导致无法 mock
**✅ 正确：** 依赖通过 constructor 注入，易于 mock 和替换

---

## 5. Explicit Dependencies（显式依赖）

**依赖关系和数据流要显式。避免隐式状态和魔法行为。**

- 使用类型显式定义函数签名和类属性
- 避免隐藏状态或隐式上下文传递
- 避免隐式依赖（全局变量、魔法常量、环境变量直接引用）
- 依赖注入优先于直接实例化

### 隐式 this 状态

**用户请求：** "给用户服务添加审计日志"

**❌ 错误：** 在类上挂未声明的数据，靠运行时约定访问

```typescript
class UserService {
  // 隐式依赖：auditLog 通过运行时约定注入
  async createUser(data: CreateUserDto) {
    // 依赖 this.auditLog 存在，但类型系统无法约束
    this.auditLog.log('user.created', data);
    return this.userRepo.save(data);
  }
}
```

**✅ 正确：** 数据作为参数传入或从明确来源获取

```typescript
class UserService {
  constructor(
    private userRepo: UserRepository,
    private auditLog: AuditLogger, // 显式依赖，类型安全
  ) {}

  async createUser(data: CreateUserDto) {
    this.auditLog.log('user.created', data);
    return this.userRepo.save(data);
  }
}
```

### 全局状态隐式依赖

**用户请求：** "实现一个发送邮件的功能"

**❌ 错误：** 函数内部直接读取环境变量，全局状态隐式依赖

```python
def send_email(to: str, subject: str, body: str):
    # 隐式依赖 process.env.API_KEY，无处声明
    api_key = process.env.API_KEY
    client = EmailClient(api_key)
    return client.send(to, subject, body)
```

**✅ 正确：** 配置作为参数传入，来源清晰可追溯

```python
def send_email(to: str, subject: str, body: str, config: EmailConfig):
    # config.api_key 显式传入，调用方负责来源
    client = EmailClient(config.api_key)
    return client.send(to, subject, body)
```

### 隐式创建依赖

**用户请求：** "添加一个获取用户详情的 HTTP 客户端"

**❌ 错误：** 在函数内部直接实例化 HTTP 客户端，无法 mock

```python
def get_user(user_id: int) -> User:
    # 隐式依赖 HTTP 客户端，无法替换
    response = requests.get(f'https://api.example.com/users/{user_id}')
    return User.parse_obj(response.json())
```

**✅ 正确：** 通过参数注入，便于测试和替换

```python
def get_user(user_id: int, http_client: HttpClient = None) -> User:
    client = http_client or requests  # 支持注入默认实现
    response = client.get(f'https://api.example.com/users/{user_id}')
    return User.parse_obj(response.json())

# 测试时可以轻松 mock
def test_get_user():
    mock_client = MockHttpClient(user_data={'id': 1, 'name': 'Alice'})
    user = get_user(1, http_client=mock_client)
    assert user.name == 'Alice'
```

---

## 反模式总结

| 原则 | 反模式 | 修复 |
|------|--------|------|
| 三思后行 | 默认可选文件格式、字段、范围 | 明确列出假设，要求澄清 |
| 简洁优先 | 单一折扣计算用策略模式 | 在真正需要复杂度之前，只用一个函数 |
| 手术改动 | 重排引号、添类型提示、同时修无关错误 | 只更换能解决报告问题的行 |
| 目标驱动 | "我会审查并改进代码" | "写测试漏洞X → 让它通过 → 验证没有回归" |
| 显式依赖 | `this` 挂隐式数据、环境变量直接引用 | 通过参数/DI 传入，类型约束 |

---

## 关键见解

**"过于复杂"的例子并不明显错误** — 它们遵循设计模式和最佳实践。问题在于**时机**：在需要之前就增加了复杂性。

这导致：
- 代码更难理解
- 引入更多bug
- 实施时间更长
- 更难测试

**"简单"版本有：**
- 更容易理解
- 实现更快
- 更容易测试
- 当需要复杂度时，可以进行重构

**好的代码是能简单解决当下问题的代码，而不是过早地解决明天的问题。**

---

## 权衡说明

这些原则偏向**谨慎而非速度**。对于琐碎任务（简单typo修复、明显的单行修改），使用判断力——不是每个改动都需要全套流程。目标是减少非平凡工作中的高成本错误，而非拖慢简单任务。

---

## 检验标准

这些原则生效时你会看到：

- diff中不必要的改动更少
- 过度复杂化导致的重写更少
- 澄清问题出现在实现之前，而非错误之后
- PR干净，最小化 — 没有顺便的重构或"改进"
