from django.test import TestCase, Client

import unittest

# Create your tests here.

class Testing(TestCase):
    
    def test_index(self):
       c = Client()
       response = c.get("")
       self.assertEqual(response.status_code, 200)