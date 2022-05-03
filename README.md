## Yandex Cloud Functions

---

This function give queue name and create Queue  with **```dead```** queue.
In YCF need to create new fucntion with **```index.handler```** entry point.

--- 
#### Amazon SQS

_Add environments:_
```
AWS_ACCESS_KEY_ID='ACCESS_KEY'
AWS_REGION='us-east-1' // for Yandex 'ru-central1'
AWS_SECRET_ACCESS_KEY='SECRET_ACCESS_KEY'
```
---
### Yandex Message Queue

_Add environments:_
```
AWS_ACCESS_KEY_ID='ACCESS_KEY'
AWS_SECRET_ACCESS_KEY='SECRET_ACCESS_KEY'
AWS_REGION='ru-central1'
AWS_ENDPOINT=https://message-queue.api.cloud.yandex.net
```