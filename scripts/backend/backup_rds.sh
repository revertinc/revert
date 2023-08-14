#!/bin/bash

export TABLE=accounts; bash ./scripts/backup_table.sh
export TABLE=environments ; bash scripts/backup_table.sh
export TABLE=apps ; bash scripts/backup_table.sh
export TABLE=users ; bash scripts/backup_table.sh
export TABLE=waitlist ; bash scripts/backup_table.sh
export TABLE=connections ; bash scripts/backup_table.sh
