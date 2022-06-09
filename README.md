# cloudverse-workstation-service

## Payload Description

The SQS payload format is as follows:


The `action` key has the following possibilities: `new` | `existing`
### Create New Workstation
```
{
    "action": "new",
    "userId": "545yui4y3489175",
    "instanceType": "t2.small",
    "volumeSize": 30
}
```

### Provision Existing Workstation
```
{
    "action": "existing",
    "workstationId": "",
    "userId": "545yui4y3489175",
    "instanceType": "t2.small",
    "volumeSize": 30
}
```