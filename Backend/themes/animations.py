from themes.themes import *

def visit_animation(visited,theme_type):
    for node in visited:
        if node.color == themes[theme_type]["closed_color_1"] or node.color == themes[theme_type]["closed_color_3"]:
            visited.remove(node)
            continue
        r, g, b = node.color
        if g < 255:
            g += 1
        node.color = (r, g, b)

def visit_animation2(node,theme_type):
    if node.color == themes[theme_type]["closed_color_1"]:
        return True
    else:
        r, g, b = node.color
        b += 1
        node.color = (r, g, b)
        return False
        
def path_animation(path, theme_type):
    for node in path:
        if not node.is_start():
            start_color = themes[theme_type]["path_color_1"]
            end_color = themes[theme_type]["path_color_2"]
            if node.dec_animation:
                node.t = max(0, node.t - 0.01)
            else:
                node.t = min(1, node.t + 0.01)
            node.color = (
                int(start_color[0] * (1 - node.t) + end_color[0] * node.t),
                int(start_color[1] * (1 - node.t) + end_color[1] * node.t),
                int(start_color[2] * (1 - node.t) + end_color[2] * node.t)
            )
            if node.t <= 0:
                node.dec_animation = False
            elif node.t >= 1:
                node.dec_animation = True