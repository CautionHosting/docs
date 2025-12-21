---
icon: lucide/box
---

# caution apps


Manage your deployed applications.

## Usage

```bash
caution apps <command>
```

## Commands

### list

Lorem ipsum dolor sit amet.

```bash
caution apps list
```

### get

Lorem ipsum dolor sit amet.

```bash
caution apps get <app-id>
```

### create

Lorem ipsum dolor sit amet.

```bash
caution apps create --name <name>
```

### destroy

Lorem ipsum dolor sit amet.

```bash
caution apps destroy <app-id>
```

!!! warning
    Lorem ipsum dolor sit amet.

## Example

```bash
$ caution apps list
ID                                    NAME           STATUS
550e8400-e29b-41d4-a716-446655440000  my-api         running

$ caution apps get 550e8400-e29b-41d4-a716-446655440000
Name:      my-api
Status:    running
URL:       https://my-api.example.app
```

## See also

- [caution verify](verify.md)
- [caution describe](describe.md)
