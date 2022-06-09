import boto3
import requests
import pandas as pd

workstation_id = None

# to get instanceId from meta-data of current running ec2
instance_id = requests.get(
    'http://169.254.169.254/latest/meta-data/instance-id').text

# getting dynamodb object for connection
dynamodb = boto3.resource('dynamodb',
                          aws_access_key_id='',
                          aws_secret_access_key='',
                          region_name='')

#dynamodb = boto3.resource(
#    'dynamodb',
#    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_API'),
#    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
#    region_name=os.environ.get('REGION_NAME')
#    )

# getting 'cloudverse_prod_users' table to search userId and workstationId
table = dynamodb.Table('cloudverse_prod_users')

# Getting Table data with scanning userId and workstationId
response = table.scan(AttributesToGet=['userId', 'workstations'])

# storing table data into pandas dataframe
pdf = pd.DataFrame(response['Items'])


# custom function to get workstationId and userId
def get_item(row):
    global workstation_id
    data = row['workstations']
    for item in data:
        if item.get('instanceId') == instance_id:
            workstation_id = item.get('workstationId')
            return True
    return False


# searching for userId based on instanceId
user_id = pdf[pdf.apply(get_item, axis=1)]['userId'].values[0]

# storing userId and workstationId into file for further use.
with open(r"C:\Windows\Temp\userdataFile.txt", 'w') as f:
    f.write(user_id + '\n' + workstation_id)

with open(r"C:\Users\Administrator\Documents\Local Folder\sync.bat", 'w') as f:
    f.write('aws s3 sync . s3://cloudverse-workstation-folder-sync/' +
            user_id + '/' + workstation_id + ' && ' +
            'aws s3 sync s3://cloudverse-workstation-folder-sync/' + user_id +
            '/' + workstation_id + ' .')
