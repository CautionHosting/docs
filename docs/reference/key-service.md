---
icon: lucide/key-square
---

# Key Services

Caution allows self-custody of encryption keys by using a sharded M-of-N key
loading scheme, using keys generated using the Caution-provided Keymaker
service. These keys can then be loaded by your application using Locksmith, at
which point they can be used for signing messages and decrypting secrets.

## Creating Key Pairs with Keymaker

You will need an ASCII Armored OpenPGP keyring with all the keys you want to
use for sharding (this can be generated using `gpg --export --armor`).

```sh
caution keypair new --threshold 2 --max 3 keyring.asc > keypair.json
```

If the output of the command is not redirected, and the CLI detects that it
would otherwise print to a terminal output, it will write the key to a Caution
directory, if one exists.

## Creating Single-User Key Pairs with Keymaker

For use with a single key, you can omit the threshold and max - though you may
be warned of the possible side effects of not having a large quorum.

```sh
caution keypair new my_pubkey.crt.asc > keypair.json
```
