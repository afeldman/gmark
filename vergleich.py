#!/usr/bin/env python3

import json

from bookmark import Bookmark
from stack import Stack

from os import listdir
from os.path import isfile, join, abspath

import sys 

file_path = abspath(sys.argv[1])

file_list = [join(file_path,f) for f in listdir(file_path) if isfile(join(file_path, f))]

bookmark_s = set()

stack = Stack()

def add_bookmark(tag):
# tag['type'] == 'url':
 uri = tag['url']
 title = tag['name']
 dateAdded = int(tag['date_added'])
 add_date = dateAdded/10000000
 
 bk=Bookmark(title,uri,add_date)
 bookmark_s.add(bk)
 
def deep_search(tags):

 for tag in tags:
  print (tag)
# if tags.has_key('children'):
#  tag = tags['children']
#  stack.push(tag)
  
#  for tag in tags:
#   deep_search(tag)
  
  #if tag['type'] == 'folder':
  # pass  
 

for file in file_list: 
 f = open(file,'r')
 con = json.load(f)
 f.close()

 # get the root element
 con_list = con['roots']
 #get the bookmarkbar
 bookmark_bar = con_list['bookmark_bar']

 #one level children
 tags = bookmark_bar['children']

 deep_search(tags)

