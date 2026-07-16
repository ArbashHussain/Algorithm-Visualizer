import math
import pygame
import random
from system import button,screen,create_button,is_hover
from themes.colors import *
from themes.themes import *
from sort_algos import *
from sort_info import *
import main_app
pygame.init()

SIDE_PADDING = 40  # 50 on left and 50 on right
TOP_PADDING = 150
FONT = pygame.font.SysFont("comicsans", 20)
LARGE_FONT = pygame.font.SysFont("comicsans", 40)
ICON_SIZE = (50,50)

class DrawInformation:
    def __init__(self, width, height, lst, window, theme_type):
        self.width = width
        self.height = height
        self.lst = lst
        self.window = window
        self.bg_color = themes[theme_type]["bg_color"]
        self.set_list(lst)

    def set_list(self, lst):
        self.lst = lst
        self.min_val = min(lst)
        self.max_val = max(lst)
        list_range = self.max_val - self.min_val
        self.bar_width = round((self.width - SIDE_PADDING) / len(lst))
        self.bar_height = math.floor((self.height - TOP_PADDING) / (list_range))
        self.start_x = SIDE_PADDING // 2

def draw(draw_info, algorithms, back_button, mode_button, sound_button, options, output, theme_type, ascending, menu=True,is_uniform=False):
    if theme_type == 'Synth':
        draw_info.window.fill(BLACK)
    else:
        draw_info.window.fill(themes[theme_type]['plane_color'])
    # Draw sorting visualizer
    draw_list(draw_info,theme_type=theme_type,is_uniform=is_uniform)
    
    if menu:
        # Fill menu portion with black color
        pygame.draw.rect(draw_info.window, themes[theme_type]["menu_bg_color"], (draw_info.width + 53, 0, draw_info.window.get_width() - draw_info.width, draw_info.window.get_height()))

        font = pygame.font.SysFont('verdana', 35)
        text = font.render("Sorting Algorithms", 1, themes[theme_type]["heading_color"])
        top = 0  
        ht = 900
        width = ht
        delta = 700
        end = ht//40
        draw_info.window.blit(back_button["image"], back_button["rect"])
        draw_info.window.blit(text, ((width+delta//4.3), (end-top)/2.5))
        draw_info.window.blit(mode_button["image"], mode_button["rect"])
        draw_info.window.blit(sound_button["image"], sound_button["rect"])
        # Draw menu functions
        for algorithm in algorithms:
            if theme_type == 'Synth':        
                algorithm.theme_type = 'Synth'
            else:
                algorithm.theme_type = 'Default'
            algorithm.draw(draw_info.window,theme_type=theme_type)
        
        text = font.render("Settings", 1, themes[theme_type]["heading_color"])
        but_height = ht//14.5
        top += (8*but_height)
        end += (1.9*(3*but_height//2)) + but_height + ht//12
        draw_info.window.blit(text, (width+delta//3 + 45, (end-top) + 1.1*top))
        
        for option in options:
            if option.text=='Ascending' or option.text=='Descending':
                option.text=f"{'Ascending' if ascending else 'Descending'}"
            
            if option.text=='Uniform Array' or option.text=='Non-Uniform Array':
                option.text=f"{'Uniform Array' if is_uniform else 'Non-Uniform Array'}"
    
            if theme_type == 'Synth':        
                option.theme_type = 'Synth'
            
            else:
                output.theme_type = 'Default'    
            
            option.draw(draw_info.window,theme_type=theme_type)
        
        if theme_type == 'Synth':        
            output.theme_type = 'Synth'
        else:
            output.theme_type = 'Default'
        output.draw(draw_info.window,theme_type=theme_type)
    pygame.display.update()



def draw_list(draw_info, color_positions={}, theme_type='Default', clear_bg=False, is_uniform=False):
    lst = draw_info.lst
    if clear_bg:
        if theme_type == 'Synth':
            clear_rect = (SIDE_PADDING//2, TOP_PADDING, (draw_info.width-SIDE_PADDING), (draw_info.height-TOP_PADDING))
            pygame.draw.rect(draw_info.window, BLACK, clear_rect)
        else:
            clear_rect = (SIDE_PADDING//2, TOP_PADDING, (draw_info.width-SIDE_PADDING), (draw_info.height-TOP_PADDING))
            pygame.draw.rect(draw_info.window, themes[theme_type]['plane_color'], clear_rect)

    if not is_uniform:
        # Set the font and the width limit for the list area
        font = pygame.font.SysFont('verdana', 17)
        width_limit = draw_info.width - 2 * SIDE_PADDING

        # Render each element of the list, starting a new line if the width limit is exceeded
        total_width = 0
        line_height = 0
        lines = []
        elements = []
        for i, val in enumerate(lst):
            text = font.render(str(val), 1, themes[theme_type]['list_font_color'])
            if total_width + text.get_width() > width_limit:  # Start a new line
                lines.append(elements)
                elements = []
                total_width = 0
                line_height += text.get_height() + 10
            elements.append((text, total_width, line_height))
            total_width += text.get_width()
            if i < len(lst) - 1:  # Don't render comma after the last element
                comma = font.render(', ', 1, themes[theme_type]['list_font_color'])
                elements.append((comma, total_width, line_height))
                total_width += comma.get_width()
        lines.append(elements)  # Add the last line

        # Center align each line separately
        for elements in lines:
            total_width = sum(text.get_width() for text, _, _ in elements)
            start_x = (draw_info.width - total_width) // 2
            for text, x, y in elements:
                draw_info.window.blit(text, (start_x + x, TOP_PADDING//2 + y))

    for i, val in enumerate(lst):
        x = draw_info.start_x + i * draw_info.bar_width
        y = draw_info.height - (val - draw_info.min_val) * (draw_info.bar_height)
        color = themes[theme_type]['bars_color'][i % 3]
        if i in color_positions:
            color = color_positions[i]

        
        target_color = themes[theme_type]['bars_color_2'][i % 3]
        t = (pygame.time.get_ticks() % 2000) / 2000  # Change 2000 to adjust speed
        t = (math.sin(t * 2 * math.pi) + 1) / 2  # Map time to [0, 1] range
        color = (
            color[0] * (1 - t) + target_color[0] * t,
            color[1] * (1 - t) + target_color[1] * t,
            color[2] * (1 - t) + target_color[2] * t
        )
        pygame.draw.rect(draw_info.window, color, (x, y, draw_info.bar_width, draw_info.height))

    if clear_bg:
        pygame.display.update()

def generate_list(n, min_val, max_val,uniform=False):
    lst = []
    for _ in range(n):
        val = random.randint(min_val, max_val) if not uniform else random.uniform(0, 1)
        lst.append(val)
    return lst


def main(window):
    theme_type = 'Default'
    w, ht = pygame.display.get_surface().get_size()
    width = ht
    delta = w - width
    
    n = 50
    min_val = 0
    max_val = 100
    
    top_start = ht/30
    but_height = ht//15
    but_width = delta//2.2
    horizontal_gap_factor = but_width-but_height  
    vertical_gap_factor = but_height
    
    back_button = {}
    sound_button = {}
    mode_button = {}
    muted = False
    ascending = True
    
    black_back_icon = pygame.image.load('assets/black_back.png')
    black_day_icon = pygame.image.load('assets/black_sun.png')
    black_sound_icon = pygame.image.load('assets/black_sound.png')
    black_mute_icon = pygame.image.load('assets/black_mute.png')
    
    white_back_icon = pygame.image.load('assets/white_back.png')
    white_night_icon = pygame.image.load('assets/white_moon.png')
    white_sound_icon = pygame.image.load('assets/white_sound.png')
    white_mute_icon = pygame.image.load('assets/white_mute.png')
    
    
    create_button(back_button, black_back_icon, ((1010), (900//40)/2.5))
    create_button(mode_button, black_day_icon, ((1395), (900//40)/2.5))
    create_button(sound_button, black_sound_icon, ((1445), (900//40)/2.5))
    
    algorithms = [
        button(width+delta//4 +30, top_start + vertical_gap_factor,
               but_width-but_height-20, but_height, text='Bubble Sort',theme_type=theme_type),
        
        button(width+delta//4+ 30, top_start + (2*vertical_gap_factor),
               but_width-but_height-20, but_height, text='Selection Sort',theme_type=theme_type),

        button(width+delta//4+ 30, top_start + (3*vertical_gap_factor),
               but_width-but_height-20, but_height, text='Insertion Sort',theme_type=theme_type),
        
        button(width+delta//4+ 30, top_start + (4*vertical_gap_factor), 
               but_width-but_height-20, but_height, text='Tim Sort',theme_type=theme_type),
        
        button((width+delta//4 + horizontal_gap_factor+12),
               top_start + vertical_gap_factor, but_width-but_height-20, but_height, text='Merge Sort',theme_type=theme_type),

        button((width+delta//4 + horizontal_gap_factor+12), top_start +
                (2*vertical_gap_factor), but_width-but_height-20, but_height, text='Quick Sort',theme_type=theme_type),

        button((width+delta//4 + horizontal_gap_factor+12), top_start +
               (3*vertical_gap_factor), but_width-but_height-20, but_height, text='Radix Sort',theme_type=theme_type),
   
        button((width+delta//4 + horizontal_gap_factor+12), top_start +
               (4*vertical_gap_factor), but_width-but_height-20, but_height, text='Bucket Sort',theme_type=theme_type),
    ]
    options_fst_hf_wdt = (but_width-but_height)//2
    options_sec_hf_st = (width+delta//4 + 30 + horizontal_gap_factor-20)
    options_sec_hf_wdt = (but_width-but_height-20)//3 + 1
    options_start_top = top_start + (8*vertical_gap_factor) + 2
    options = [
        button(width+delta//4 + 30, options_start_top, options_fst_hf_wdt, but_height, text="Generate",theme_type=theme_type),
        button(width+delta//4 + 30 + options_fst_hf_wdt,  options_start_top,   options_fst_hf_wdt, but_height, text="Slow   ",theme_type=theme_type),
        button(options_sec_hf_st, options_start_top, options_sec_hf_wdt, but_height, text="Fast",theme_type=theme_type),
        button(options_sec_hf_st + options_sec_hf_wdt, options_start_top, options_sec_hf_wdt, but_height, text="-",theme_type=theme_type),
        button(options_sec_hf_st + options_sec_hf_wdt*2, options_start_top, options_sec_hf_wdt, but_height, text="+",theme_type=theme_type),
        button(width+delta//4 + 30, options_start_top + but_height+1, (but_width-but_height-20), but_height, text=f"{'Ascending' if ascending else 'Descending'}",theme_type=theme_type),
        button(options_sec_hf_st, options_start_top + but_height+1, (but_width-but_height-19), but_height, text="Uniform Array",theme_type=theme_type),
    ]
    #* Result Screen
    sc_y_start = ht-240
    sc_x_start = width+delta//4 + 30 #28
    sc_height = 250
    sc_width = (but_width-but_height-17)*2
    lst = generate_list(n, min_val, max_val,uniform=False)
    
    draw_info = DrawInformation(width + 150, width, lst, window, theme_type)
    sorting = False
    sorting_algorithm = None
    sorting_algorithm_name = ""
    sorting_algorithm_generator = None
    
    output = screen(sc_x_start, sc_y_start, sc_width, sc_height, "Choose an Algorithm",color=themes[theme_type]['output_screen_color'])
    output.set_label1(f"Range: {n}")
    output.set_text1("Instructions")
    output.set_text4("""
                     1. Select an Algorithm.
                     2. Press Space to Start.
                     """)

    run = True
    clock = pygame.time.Clock()
    low = 0
    high = len(draw_info.lst)
    speed = 60
    is_uniform = False
    while run:
        clock.tick(speed)
        if sorting:
            try:
                next(sorting_algorithm_generator)
                
            except StopIteration:
                sorting = False
                
        if is_uniform:  
            draw(draw_info,algorithms,back_button,mode_button,sound_button,options,output,theme_type,ascending=ascending,is_uniform=True)  
        else: 
            draw(draw_info,algorithms,back_button,mode_button,sound_button,options,output,theme_type,ascending=ascending,is_uniform=False)        
            
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False

            if event.type == pygame.KEYDOWN:        
                if event.key == pygame.K_r:
                    lst = generate_list(n, min_val, max_val)
                    is_uniform = False
                    draw_info.set_list(lst)
                    sorting = False
                
                elif event.key == pygame.K_o and not sorting:
                    ascending = not ascending
                
                elif event.key == pygame.K_SPACE and not sorting:
                    if sorting_algorithm_name == "Bucket Sort" and not is_uniform:
                        output.set_error_message("Uniform Array Required")
                        continue
                    elif sorting_algorithm == None:
                        sorting_algorithm = bubble_sort
                        sorting_algorithm_name = 'Bubble Sort'
                        
                    sorting = True
                    sorting_algorithm_generator = sorting_algorithm(draw_info, draw_info.lst, low, high, ascending, theme_type, muted)

            
            if pygame.mouse.get_pressed()[0]:
                pos = pygame.mouse.get_pos()
                output.set_error_message("")
                if is_hover(back_button,pos):
                    print("Sending to Main Menu")
                    main_app.main_menu()
                
                if is_hover(sound_button,pos):
                    muted = not muted
                    if muted:
                        sound_button["image"] = black_mute_icon if theme_type == 'Default' else white_mute_icon
                    else:
                        sound_button["image"] = black_sound_icon if theme_type == 'Default' else white_sound_icon
                
                if is_hover(mode_button,pos):
                    theme_type = 'Default' if theme_type == 'Synth' else 'Synth'
                    if theme_type == 'Default':
                        mode_button["image"] = black_day_icon
                        back_button["image"] = black_back_icon
                        sound_button["image"] = black_mute_icon if muted else black_sound_icon
                        
                    else:
                        mode_button["image"] = white_night_icon
                        back_button["image"] = white_back_icon
                        sound_button["image"] = white_mute_icon if muted else white_sound_icon
                    
                    draw_info = DrawInformation(width + 150, width, lst, window, theme_type)

                elif algorithms[0].is_hover(pos):
                    algorithms[0].toggle_color()
                    sorting_algorithm = bubble_sort
                    sorting_algorithm_name = 'Bubble Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Bubble_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                    
                elif algorithms[1].is_hover(pos):
                    algorithms[1].toggle_color()
                    sorting_algorithm = selection_sort
                    sorting_algorithm_name = 'Selection Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Selection_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                
                elif algorithms[2].is_hover(pos):
                    algorithms[2].toggle_color()
                    sorting_algorithm = insertion_sort
                    sorting_algorithm_name = 'Insertion Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Insertion_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                    
                elif algorithms[3].is_hover(pos):
                    algorithms[3].toggle_color()
                    sorting_algorithm = tim_sort
                    sorting_algorithm_name = 'Tim Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Tim_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)

                elif algorithms[4].is_hover(pos):
                    algorithms[4].toggle_color()
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                    sorting_algorithm = merge_sort
                    sorting_algorithm_name = 'Merge Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Merge_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                    
                elif algorithms[5].is_hover(pos):
                    algorithms[5].toggle_color()
                    sorting_algorithm = quick_sort
                    sorting_algorithm_name = 'Quick Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Quick_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                    
                elif algorithms[6].is_hover(pos):
                    algorithms[6].toggle_color()
                    sorting_algorithm = radix_sort
                    sorting_algorithm_name = 'Radix Sort'
                    output.set_text1(sorting_algorithm_name)
                    output.set_text4(Radix_Sort)
                    output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)

                elif algorithms[7].is_hover(pos):
                    algorithms[7].toggle_color()
                    if is_uniform:
                        sorting_algorithm = bucket_sort
                        sorting_algorithm_name = 'Bucket Sort'
                        output.set_text1(sorting_algorithm_name)
                        output.set_text4(Bucket_Sort)
                        output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                    else:
                        sorting_algorithm_name = 'Bucket Sort'
                        output.set_text1(sorting_algorithm_name)
                        output.set_text4("")
                        output.set_error_message("Uniform Array Required")
                        output.draw(draw_info.window,theme_type=theme_type,outline=BLACK)
                                        
                elif options[0].is_hover(pos):
                    options[0].toggle_color()
                    lst = generate_list(n, min_val, max_val)
                    draw_info.set_list(lst)
                    sorting = False
                                     
                elif options[1].is_hover(pos):
                    options[1].toggle_color()
                    if speed>=20:
                        speed-=10
                        
                
                elif options[2].is_hover(pos):
                    options[2].toggle_color()
                    if speed<=90:
                        speed+=10
                        
                
                elif options[3].is_hover(pos):
                    options[3].toggle_color()
                    if n>=20:
                        n-=10
                        lst = generate_list(n, min_val, max_val)
                        draw_info.set_list(lst)
                        sorting = False
                        high = len(draw_info.lst)
                        output.set_label1(f"Range: {n}")
                    else:
                        continue

                elif options[4].is_hover(pos):
                    options[4].toggle_color()
                    if n<100:
                        n+=10
                        lst = generate_list(n, min_val, max_val)
                        draw_info.set_list(lst)
                        sorting = False
                        high = len(draw_info.lst)
                        output.set_label1(f"Range: {n}")
                    else:
                        continue
                        
                
                elif options[5].is_hover(pos):
                    options[5].toggle_color()
                    ascending = not ascending
                
                elif options[6].is_hover(pos):
                    options[6].toggle_color()
                    lst = generate_list(n, min_val, max_val,uniform=True)
                    is_uniform = True                    
                    draw_info.set_list(lst)
                    sorting = False
                    low = 0
                    high = len(draw_info.lst)
                    if sorting_algorithm_name == 'Bucket Sort':
                        sorting_algorithm = bucket_sort
                        output.set_text1(sorting_algorithm_name)
                        output.set_text4(Bucket_Sort)
                        output.draw(draw_info.window, BLACK)
                                     
                
                

    pygame.quit()


if __name__ == "__main__":
    width = 800
    win = pygame.display.set_mode((width+700, width))
    main(win)