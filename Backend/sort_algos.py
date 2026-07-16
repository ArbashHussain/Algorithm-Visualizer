import sort_main
from themes.colors import *
from themes.themes import themes
import threading
from utils import *

MIN_MERGE = 32
SCALE_FACTOR = 20
def calculate_min_run(n): 
    """Returns the minimum length of a 
    run from 23 - 64 so that 
    the len(array)/minrun is less than or 
    equal to a power of 2.  
    """
    r = 0
    while n >= MIN_MERGE: 
        r |= n & 1
        n >>= 1
    return n + r 



def bubble_sort(draw_info,arr,low,high,ascending,theme_type,muted):
    for i in range(high):
        for j in range(high-i-1):
            if (arr[j]>arr[j+1] and ascending) or (arr[j]<arr[j+1] and not ascending):
                arr[j], arr[j+1] = arr[j+1], arr[j]
                sort_main.draw_list(draw_info,{j:themes[theme_type]['current_color'],j+1:themes[theme_type]['other_color']},theme_type=theme_type,clear_bg=True)
                if not muted and j < len(arr) - 1:
                    sound_thread = threading.Thread(target=play_sound, args=(arr[j] * SCALE_FACTOR,))
                    sound_thread.start()
                yield True
    return arr
        
def selection_sort(draw_info, arr, low, high, ascending ,theme_type,muted):
    for i in range(low, high):
        min_idx = i
        for j in range(i + 1, high):
            if (arr[j] < arr[min_idx] and ascending) or (arr[j] > arr[min_idx] and not ascending):
                min_idx = j
                sort_main.draw_list(draw_info, {i: themes[theme_type]['current_color'], min_idx: themes[theme_type]['other_color']},theme_type=theme_type, clear_bg=True)
                if not muted and j < len(arr) - 1:
                    sound_thread = threading.Thread(target=play_sound, args=(arr[j] * SCALE_FACTOR,))
                    sound_thread.start()
                yield True
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
        sort_main.draw_list(draw_info, {i: themes[theme_type]['current_color'], min_idx: themes[theme_type]['other_color']},theme_type=theme_type, clear_bg=True)
        if not muted and i < len(arr) - 1:
            play_sound(arr[i] * SCALE_FACTOR)  # Play a sound each time a swap is made
        yield True
    return arr

def insertion_sort(draw_info, arr, low, high, ascending ,theme_type,muted):
    for i in range(low, high):
        key = arr[i]
        j = i - 1
        if ascending:            
            while j >= low and arr[j] > key:
                arr[j + 1] = arr[j]
                j -= 1
                sort_main.draw_list(draw_info, {j: themes[theme_type]['current_color'], j + 1: themes[theme_type]['other_color']},theme_type=theme_type, clear_bg=True)
                if not muted and j < len(arr) - 1:
                    sound_thread = threading.Thread(target=play_sound, args=(arr[j] * SCALE_FACTOR,))
                    sound_thread.start()
                yield True
            arr[j + 1] = key
            sort_main.draw_list(draw_info, {j + 1: themes[theme_type]['pivot_color']},theme_type=theme_type, clear_bg=True)
            if not muted and j < len(arr) - 1:
                sound_thread = threading.Thread(target=play_sound, args=(arr[j+1] * SCALE_FACTOR,))
                sound_thread.start()
                # play_sound(arr[j + 1] * SCALE_FACTOR)
            yield True
        else:
            while j >= low and arr[j] < key:
                arr[j + 1] = arr[j]
                j -= 1
                sort_main.draw_list(draw_info, {j: themes[theme_type]['current_color'], j + 1: themes[theme_type]['other_color']},theme_type=theme_type, clear_bg=True)
                if not muted and j < len(arr) - 1:
                    sound_thread = threading.Thread(target=play_sound, args=(arr[j] * SCALE_FACTOR,))
                    sound_thread.start()
                yield True
            arr[j + 1] = key
            sort_main.draw_list(draw_info, {j + 1: themes[theme_type]['pivot_color']},theme_type=theme_type, clear_bg=True)
            if not muted and j < len(arr) - 1:
                sound_thread = threading.Thread(target=play_sound, args=(arr[j+1] * SCALE_FACTOR,))
                sound_thread.start()
            yield True    
    return arr

def merge_sort(draw_info, lst, low, high, ascending ,theme_type,muted):
    def merge(lst, l, m, r, ascending,theme_type, muted):
        n1 = m - l + 1
        n2 = r - m

        L = [0] * (n1)
        R = [0] * (n2)

        for i in range(0, n1):
            L[i] = lst[l + i]

        for j in range(0, n2):
            R[j] = lst[m + 1 + j]

        i = 0
        j = 0
        k = l

        while i < n1 and j < n2:
            if (L[i] <= R[j] and ascending) or (L[i] >= R[j] and not ascending):
                lst[k] = L[i]
                i += 1
            else:
                lst[k] = R[j]
                j += 1
            k += 1
            sort_main.draw_list(draw_info, {k: themes[theme_type]['current_color']},theme_type=theme_type,clear_bg=True)
            if not muted and k < len(lst) - 1:
                sound_thread = threading.Thread(target=play_sound, args=(lst[k] * SCALE_FACTOR,))
                sound_thread.start()
            yield True

        while i < n1:
            lst[k] = L[i]
            i += 1
            k += 1
            sort_main.draw_list(draw_info, {k: themes[theme_type]['current_color']},theme_type=theme_type,clear_bg=True)
            if not muted and k < len(lst) - 1:
                sound_thread = threading.Thread(target=play_sound, args=(lst[k] * SCALE_FACTOR,))
                sound_thread.start()
            yield True

        while j < n2:
            lst[k] = R[j]
            j += 1
            k += 1
            sort_main.draw_list(draw_info, {k: themes[theme_type]['current_color']},theme_type=theme_type,clear_bg=True)
            if not muted and k < len(lst) - 1:
                sound_thread = threading.Thread(target=play_sound, args=(lst[k] * SCALE_FACTOR,))
                sound_thread.start()
            yield True
        return lst

    def merge_sort(lst, l, r, ascending ,theme_type,muted):
        if l < r:
            m = (l + (r - 1)) // 2

            yield from merge_sort(lst, l, m, ascending,theme_type,muted)
            yield from merge_sort(lst, m + 1, r, ascending,theme_type,muted)
            yield from merge(lst, l, m, r, ascending,theme_type,muted)

    yield from merge_sort(lst, 0, len(lst) - 1, ascending,theme_type,muted)
    return lst

def quick_sort(draw_info, lst, low, high, ascending ,theme_type,muted):
    def partition(lst, low, high, ascending ,theme_type,muted):
        i = (low - 1)
        pivot = lst[high]

        for j in range(low, high):
            if (lst[j] < pivot and ascending) or (lst[j] > pivot and not ascending):
                i = i + 1
                lst[i], lst[j] = lst[j], lst[i]
                sort_main.draw_list(draw_info, {i: themes[theme_type]['current_color'], j: themes[theme_type]['other_color']},theme_type=theme_type, clear_bg=True)
                if not muted and i < len(lst) - 1:
                    sound_thread = threading.Thread(target=play_sound, args=(lst[i] * SCALE_FACTOR,))
                    sound_thread.start()
                yield True

        lst[i + 1], lst[high] = lst[high], lst[i + 1]
        sort_main.draw_list(draw_info, {i + 1: themes[theme_type]['current_color'], high: themes[theme_type]['other_color']},theme_type=theme_type, clear_bg=True)
        if not muted and i < len(lst) - 1:
            sound_thread = threading.Thread(target=play_sound, args=(lst[i+1] * SCALE_FACTOR,))
            sound_thread.start()
        yield True
        return (i + 1)

    def quick_sort(lst, low, high, ascending ,theme_type,muted):
        if low < high:
            pi = yield from partition(lst, low, high, ascending, theme_type,muted)
            yield from quick_sort(lst, low, pi - 1, ascending, theme_type,muted)
            yield from quick_sort(lst, pi + 1, high, ascending,theme_type,muted)

    yield from quick_sort(lst, 0, len(lst) - 1, ascending,theme_type,muted)
    return lst
             
def merge(draw_info, arr, l, m, r, ascending,theme_type,muted): 
    len1 = m - l + 1
    len2 = r - m
    
    left, right = [], [] 
    
    for i in range(0, len1): 
        left.append(arr[l + i])

    for i in range(0, len2):
        right.append(arr[m+i+1])
    
    i, j, k = 0, 0, l

    while i < len1 and j < len2: 
        if ascending:
            if left[i] <= right[j]: 
                arr[k] = left[i] 
                i += 1
            else: 
                arr[k] = right[j] 
                j += 1
        else:
            if left[i] >= right[j]: 
                arr[k] = left[i] 
                i += 1
            else: 
                arr[k] = right[j] 
                j += 1

        sort_main.draw_list(draw_info, {k: themes[theme_type]['current_color']},theme_type=theme_type, clear_bg=True)
        if not muted and k < len(arr):
            sound_thread = threading.Thread(target=play_sound, args=(arr[k] * SCALE_FACTOR,))
            sound_thread.start()
        yield True
        k += 1
               
    while i < len1: 
        arr[k] = left[i] 
        k += 1
        i += 1
        sort_main.draw_list(draw_info, {}, theme_type=theme_type,clear_bg=True)
        if not muted and k < len(arr):
            sound_thread = threading.Thread(target=play_sound, args=(arr[k] * SCALE_FACTOR,))
            sound_thread.start()
        yield True
        
    while j < len2: 
        arr[k] = right[j] 
        k += 1
        j += 1
        sort_main.draw_list(draw_info, {}, theme_type=theme_type,clear_bg=True)
        if not muted and k < len(arr):
            sound_thread = threading.Thread(target=play_sound, args=(arr[k] * SCALE_FACTOR,))
            sound_thread.start()
        yield True
             
def tim_sort(draw_info, arr, low, high, ascending, theme_type, muted):
    min_run = calculate_min_run(high)
    for i in range(low, high, min_run):
        end = min((i + min_run - 1), high - 1)
        yield from insertion_sort(draw_info, arr, i, end+1, ascending, theme_type, muted)
        if not muted and i < len(arr) - 1:
            sound_thread = threading.Thread(target=play_sound, args=(arr[i] * SCALE_FACTOR,))
            sound_thread.start()

    size = min_run

    while size < high:
        for left in range(low, high, 2 * size):
            mid = min((left + size - 1), (high - 1))
            right = min((left + 2 * size - 1), (high - 1))
            if mid < right:
                yield from merge(draw_info, arr, left, mid, right, ascending, theme_type, muted)
                if not muted and left < len(arr) - 1:
                    sound_thread = threading.Thread(target=play_sound, args=(arr[left] * SCALE_FACTOR,))
                    sound_thread.start()
        size = 2 * size

def bucket_sort(draw_info, lst, low, high, ascending, theme_type, muted):
    arr = []
    slot_num = 10
    for i in range(slot_num):
        arr.append([])
    for j in lst:
        index_b = int(slot_num * j)
        arr[index_b].append(j)
    for i in range(slot_num):
        arr[i] = sorted(arr[i], reverse=not ascending)
    k = 0
    bucket_range = range(slot_num) if ascending else range(slot_num-1, -1, -1)
    for i in bucket_range:
        for j, item in enumerate(arr[i]):
            lst[k] = item
            k += 1
            sort_main.draw_list(draw_info, {k: themes[theme_type]['current_color']},theme_type=theme_type,clear_bg=True,is_uniform=True)
            if not muted and k < len(lst) - 1:
                sound_thread = threading.Thread(target=play_sound, args=(lst[k] * SCALE_FACTOR,))
                sound_thread.start()
            yield True

def radix_count_sort(draw_info, arr, place, ascending, theme_type, muted):
    n = len(arr)
    output_arr = [0] * n
    count = [0] * 10

    for i in range(n):
        index = arr[i] / place
        count[int(index % 10)] += 1

    for i in range(1, 10):
        count[i] += count[i - 1]

    if ascending:
        i = n - 1
        while i >= 0:
            index = arr[i] / place
            output_arr[count[int(index % 10)] - 1] = arr[i]
            count[int(index % 10)] -= 1
            i -= 1
    else:
        i = 0
        while i < n:
            index = arr[i] / place
            output_arr[n - count[int(index % 10)]] = arr[i]
            count[int(index % 10)] -= 1
            i += 1

    for i in range(n):
        arr[i] = output_arr[i]
        sort_main.draw_list(draw_info, {i: themes[theme_type]['current_color']},theme_type=theme_type,clear_bg=True)
        if not muted and i < len(arr) - 1:
            sound_thread = threading.Thread(target=play_sound, args=(arr[i] * SCALE_FACTOR,))
            sound_thread.start()
        yield True

def radix_sort(draw_info, arr, low, high, ascending, theme_type, muted):
    max_ele = max(arr)
    place = 1
    while max_ele // place > 0:
        yield from radix_count_sort(draw_info, arr, place, ascending, theme_type, muted)
        if not muted and max_ele * SCALE_FACTOR < 20000:
            sound_thread = threading.Thread(target=play_sound, args=(max_ele * SCALE_FACTOR,))
            sound_thread.start()
        place *= 10
        