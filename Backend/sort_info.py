Bubble_Sort = """Repeatedly steps through the list, compares adjacent
elements and swaps them if they are in the wrong order. 
The pass through the list is repeated until the list is sorted.\n
Time Complexity: O(n^2)
Space Complexity: O(1)
"""

Insertion_Sort = """Algorithm that builds the final sorted array one item at a time.\n
Time Complexity: O(n^2)
Space Complexity: O(1)
"""

Selection_Sort= """A simple in-place comparison sorting algorithm.
It sorts an array by repeatedly finding the minimum element
from unsorted part and putting it at the beginning.\n
Time Complexity: O(n^2)
Space Complexity: O(1)
"""

Merge_Sort= """A Divide and Conquer algorithm. It divides the input array
into two halves, calls itself for the two halves, 
and then mergesthe two sorted halves.\n
Time Complexity: O(n log n)
Space Complexity: O(n)
"""

Quick_Sort= """A Divide and Conquer algorithm. It picks an element
as pivot and partitions the given array around the pivot.\n
Time Complexity: O(n log n) in the best case, 
O(n^2) in the worst case
Space Complexity: O(log n)
"""

Radix_Sort= """A non-comparative integer sorting algorithm that sorts
data with integer keys by grouping keys by the individual digits
which share the same significant position and value.\n
Time Complexity: O(nk)
 - n: no of elements
 - k: no of digits in the max num.
Space Complexity: O(n + k)
"""

Tim_Sort= """A hybrid sorting algorithm,
derived from merge sort and insertion sort,
designed to perform well on many kinds of real-world data.\n
Time Complexity: O(n log n)
Space Complexity: O(n)
"""

Bucket_Sort= """A comparison sort algorithm that operates on elements
by dividing them into different buckets
and then sorting these buckets individually.\n
Time Complexity: O(n + k) for best and average case, O(n^2) for worst case
Space Complexity: O(nk)
"""
