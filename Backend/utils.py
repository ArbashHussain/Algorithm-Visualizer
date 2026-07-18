"""Shared helpers for the Pygame visualizers (no audio)."""

from themes.colors import *
from grid import *
from system import *


def h_score(p1, p2):
    """Manhattan-distance heuristic between two grid points."""
    x1, y1 = p1
    x2, y2 = p2
    return abs(x2 - x1) + abs(y2 - y1)


def update_info_screen(win, obj, color=BLACK, text1="", text2="", text3=""):
    if text1 != "":
        obj.set_text1(text1)
    if text2 != "":
        obj.set_text2(text2)
    if text3 != "":
        obj.set_text3(text3)
    obj.draw(win, color)


def prepare_for_search(weighted, start, end, grid, algorithm, algorithms, index):
    if len(weighted):
        for node in weighted:
            node.mark_weight()

    if start and end:
        for row in grid:
            for node in row:
                node.update_neighbors(grid)
                if (
                    not node.is_neutral()
                    and node != start
                    and node != end
                    and not node.is_barrier()
                    and not node.is_weight()
                ):
                    node.reset()

        algorithms[index].toggle_color()
        return algorithm


def prepare_for_maze(
    algorithm,
    output,
    win,
    grid,
    ROWS,
    width,
    algorithms,
    mazes,
    back_button,
    mode_button,
    options,
    theme_type,
):
    """Reset instructions and run the selected maze generator."""
    start = None
    end = None
    output.set_text1("Instructions")
    output.set_text2("")
    output.set_text3("")
    output.set_text4(
        """
     1. Pick source node\n
     2. Pick destination node\n
     3. Select the search algorithm.\n
     """
    )

    def redraw():
        draw(
            win,
            grid,
            ROWS,
            width,
            algorithms,
            mazes,
            back_button,
            mode_button,
            options,
            output,
            theme_type,
        )

    return algorithm(
        redraw,
        width,
        grid,
        start,
        end,
        0,
        ROWS,
        0,
        ROWS,
        win,
        theme_type,
    )


def update_colors(grid, theme_type):
    for row in grid:
        for node in row:
            if theme_type == "Synth":
                node.theme_type = "Synth"
    return grid
