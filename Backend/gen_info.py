DFS_GEN = """algorithm for traversing or searching tree or graph data structures. It uses backtracking to generate the maze.
Time Complexity: O(V + E) where V is number of vertices and E is number of edges
Space Complexity: O(V)

"""
PRIM = """A greedy algorithm that finds a minimum spanning tree for a weighted undirected graph. It uses the fact that every maze is a spanning tree to generate the maze.
Time Complexity: O(E log E) where E is the number of edges
Space Complexity: O(V + E) where V is the number of vertices
"""
KRUSKAL =  """A minimum-spanning-tree algorithm which finds an edge of the least possible weight that connects any two trees in the forest. It uses the fact that every maze is a spanning tree to generate the maze.
Time Complexity: O(E log E) where E is the number of edges
Space Complexity: O(V + E) where V is the number of vertices
"""

RANDOM = """Generates a maze by randomly placing walls in the grid while ensuring that there is a path from the start to the end.
Time Complexity: O(n^2) where n is the number of cells in the grid
Space Complexity: O(n^2)
"""
