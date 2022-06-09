// batch files to sync aws s3 bucket with the local folder using the aws s3 sync command
aws s3 sync . s3://cloudverse-sync
aws s3 sync s3://cloudverse-sync .

// delete duplicate files
aws s3 rm s3://cloudverse-sync/scripts/sync.bat
aws s3 rm s3://cloudverse-sync/scripts/sync.sh