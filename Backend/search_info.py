
BFS = """Algorithm for traversing or searching tree or graph data structures.
It starts at the tree root and explores all of the neighbor nodes
at the present depth prior to moving on to nodes at the next depth level.\n
Time Complexity: O(V + E)
Space Complexity: O(V)
"""

DFS =  """Algorithm for traversing or searching tree or graph data structures.
The algorithm starts at the root node and explores as far as possible 
along each branch before backtracking.\n
Time Complexity: O(V + E)
Space Complexity: O(V)
"""

IDDFS = """A state space/graph search strategy in which a depth-limited
version of depth-first search is run repeatedly with increasing depth limits
until the goal is found.\n
Time Complexity: O(V + E)
Space Complexity: O(V)
"""

BI_BFS = """Algorithm that uses two BFS starting from the source vertex and the target vertex.
The search terminates when two graphs intersect.\n
Time Complexity: O(V + E)
Space Complexity: O(V)
"""

A_STAR = """pathfinding algorithm that searches for the shortest path between
the initial and the final state. It uses a heuristic to predict the distance
to the goal from a certain state.\n
Time Complexity: O(E) 
Space Complexity: O(V)
"""

IDA_STAR = """is a graph traversal and path search algorithm that can find
the shortest path between a designated start node and any member of a set
of goal nodes in a weighted graph.\n
Time Complexity: O(b^d)
 - b is the branching factor
 - d is the depth of the solution
Space Complexity: O(bd)
"""

FLOYD = """Algorithm for finding shortest paths in a weighted graph with positive
or negative edge weights (but with no negative cycles).\n
Time Complexity: O(V^3) 
Space Complexity: O(V^2)
"""

BI_A_STAR = """Algorithm that uses two A* searches starting from the source vertex
and the target vertex. The search terminates when two graphs intersect.\n
Time Complexity: O(E)
Space Complexity: O(V)
"""

DIJKSTRA =  """Algorithm for finding the shortest paths between
nodes in a graph, which may represent, for example, road networks.\n
Time Complexity: O((V + E) log V) 
Space Complexity: O(V)
"""