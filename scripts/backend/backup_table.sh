#!/bin/bash

# Before running the script, make sure to set all the required environment variables:
# export TABLE=your_table_name
# export PG_PASSWORD_SOURCE=your_source_password
# export PG_HOST_SOURCE=your_source_host
# export PG_PASSWORD_DEST=your_destination_password
# export PG_HOST_DEST=your_destination_host

# Get the database credentials & options from environment variables
table="$TABLE"
pg_password_source="$PG_PASSWORD_SOURCE"
pg_host_source="$PG_HOST_SOURCE"
pg_db_source="postgres"
pg_user_source="postgres"
pg_password_dest="$PG_PASSWORD_DEST"
pg_host_dest="$PG_HOST_DEST"
pg_db_dest="postgres"
pg_user_dest="postgres"

# Check if any of the required environment variables are not set
if [ -z "$table" ] || [ -z "$pg_password_source" ] || [ -z "$pg_host_source" ] || [ -z "$pg_password_dest" ] || [ -z "$pg_host_dest" ]; then
  echo "Error: One or more required environment variables are not set."
  exit 1
fi


PGPASSWORD="${pg_password_source}" pg_dump -h "${pg_host_source}" -U "${pg_user_source}" --binary-upgrade  -t "${table}" "${pg_db_source}" -p 5432 -a | PGPASSWORD="${pg_password_dest}" psql -h "${pg_host_dest}" -U "${pg_user_dest}" "${pg_db_dest}"