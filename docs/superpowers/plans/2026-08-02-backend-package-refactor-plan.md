# Backend Package Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Spring Boot backend into feature-based MVC layers without changing API contracts, database schema, business behavior, or deployment configuration.

**Architecture:** Keep `auth` and `task` as bounded feature packages, then separate each into `controller`, `service`, `repository`, `model`, and one compact `dto` package. Keep cross-cutting concerns in `common`, `security`, and `health`. Update package declarations/imports and mirror the structure in tests.

**Tech Stack:** Java, Spring Boot, Spring MVC, Spring Data JPA, Jakarta Validation, Maven, JUnit.

---

### Task 1: Create the target package layout

**Files:**
- Move classes under `backend/src/main/java/vn/edu/hust/taskmanager/auth/` into the target subpackages.
- Move classes under `backend/src/main/java/vn/edu/hust/taskmanager/task/` into the target subpackages.

- [x] Create these directories:

```text
auth/{controller,service,repository,model,dto,validation}
task/{controller,service,repository,model,dto}
```

- [x] Move each class without changing its public methods or fields:
  - Auth/User controllers → `controller`
  - Auth service → `service`
  - User repository → `repository`
  - User/Task entities and enums → `model`
  - Request/response records → `dto`
  - UTF-8 validation classes → `validation`
  - Task repository interfaces/implementation → `repository`

### Task 2: Update package declarations and imports

**Files:**
- All moved Java files under `backend/src/main/java/vn/edu/hust/taskmanager/auth/` and `task/`.
- Cross-feature imports in `TaskService`, `Task`, security classes, and tests.

- [x] Change each moved file’s `package` declaration to match its new directory.
- [x] Update imports so dependencies point to the new packages, for example:

```java
import vn.edu.hust.taskmanager.auth.model.User;
import vn.edu.hust.taskmanager.auth.repository.UserRepository;
import vn.edu.hust.taskmanager.task.dto.TaskRequest;
import vn.edu.hust.taskmanager.task.model.TaskStatus;
```

- [x] Do not change endpoint mappings, DTO field names, validation rules, persistence annotations, or service method signatures.

### Task 3: Mirror packages in backend tests

**Files:**
- `backend/src/test/java/vn/edu/hust/taskmanager/auth/*.java`
- `backend/src/test/java/vn/edu/hust/taskmanager/task/*.java`

- [x] Update test package declarations/imports to reference the new production packages.
- [x] Keep test behavior and test data unchanged.

### Task 4: Verify behavior and documentation

**Files:**
- `backend/pom.xml` (read-only verification unless compilation exposes a required package reference).
- `tai-lieu/01-giai-thich-du-an.md`
- `tai-lieu/02-chuan-bi-van-dap.md`

- [x] Run `./mvnw -B test` from `backend` and require all tests to pass.
- [x] Run `./mvnw -B -DskipTests clean package` and require a successful jar build.
- [x] Search for stale imports of `vn.edu.hust.taskmanager.auth.*` and `task.*` that refer to moved classes.
- [x] Update report wording/tree to describe the new package organization while preserving the existing feature explanations.
- [x] Run `git diff --check`, inspect the final tree, commit, and push `main`.
