#!/bin/bash

export TABLE=accounts; bash ./backup_table.sh
export TABLE=environments ; bash ./backup_table.sh
export TABLE=apps ; bash ./backup_table.sh
export TABLE=users ; bash ./backup_table.sh
export TABLE=waitlist ; bash ./backup_table.sh
export TABLE=connections ; bash ./backup_table.sh