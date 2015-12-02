#!/bin/bash

RESULT=`wget -U "IS-HS-UP/0.1.0" --spider --max-redirect=0 -e use_proxy=yes -e http_proxy=localhost:8118 $1 2>&1`
for x in $RESULT; do
  if [ "$x" = '200' ]; then
    # This means all good
    echo "200"
  elif [ "$x" = '301' ]; then
    echo "301"
  elif [ "$x" = '302' ]; then
    echo "302"
  elif [ "$x" = '404' ]; then
    echo "404"
  elif [ "$x" = '403' ]; then
    echo "403"
  elif [ "$x" = '502' ]; then
    echo "502"
  elif [ "$x" = '503' ]; then
    echo "503"
  fi
done
