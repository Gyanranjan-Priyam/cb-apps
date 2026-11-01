import type { RoadmapData } from "../../types";

export const competitiveProgrammingRoadmap: RoadmapData = {
  id: "competitive-programming",
  slug: "competitive-programming",
  title: "Competitive Programming",
  description: "Complete, all-in-one guide for Competitive Programming & Algorithmic Contests (Codeforces, LeetCode, ICPC). Master C++ Fast I/O & STL, Binary Search on Answer, Prefix Sums, Sieve & Modular Inverse, Dynamic Programming (Knapsack, Tree DP, Bitmask DP), Graph Theory (Dijkstra, DSU), and Advanced Data Structures (Segment Trees, Lazy Propagation, Fenwick Trees, LCA) without needing external materials.",
  category: "dsa",
  badgeText: "Problem Solving",
  iconName: "Code2",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Competitive Programming Roadmap" },
    },
    // 1. Language & Complexity
    {
      id: "cpp-stl-complexity",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "C++ STL & Time Complexity Analysis",
        category: "Foundations",
        description: `### ⚡ Fast I/O, Time Budget & C++ Competitive Programming Template

Master C++ STL containers and calculate runtime feasibility.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-fast-io-complexity",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Fast I/O & Big-O Operations Budget",
        colorKey: "C",
        description: `### 🚀 Production C++ CP Template

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define pb push_back
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)(x).size()

const int MOD = 1e9 + 7;
const ll INF = 1e18;

void solve() {
    int n;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    
    // Solution logic here...
}

int main() {
    // Fast I/O: Unties cin from cout and turns off stdio sync
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t = 1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}
\`\`\`
`,
      },
    },
    {
      id: "sub-cpp-stl-containers",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "C++ STL: Vector, Set, Map, PQ, PBDS",
        colorKey: "C",
        description: `### 📊 Policy-Based Data Structure (Order Statistic Tree)

Find the $K$-th smallest element or count elements smaller than $X$ in $O(\\log N)$ time!

\`\`\`cpp
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp>
using namespace __gnu_pbds;

typedef tree<int, null_type, less<int>, rb_tree_tag, tree_order_statistics_node_update> ordered_set;

ordered_set ost;
ost.insert(10);
ost.insert(25);
ost.insert(5);

// 1. Find 0-indexed K-th smallest element:
cout << *ost.find_by_order(1) << "\n"; // Output: 10

// 2. Count strictly smaller elements than X:
cout << ost.order_of_key(25) << "\n";  // Output: 2
\`\`\`
`,
      },
    },

    // 2. Core Problem Solving Patterns
    {
      id: "core-patterns",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Core Patterns: Two Pointers & Binary Search",
        category: "Techniques",
        description: `### 🎯 Binary Search on Answer & Sliding Window

Convert optimization problems into monotonic decision checks.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-binary-search-answer",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "Binary Search & Binary Search on Answer",
        colorKey: "C",
        description: `### 🔍 Binary Search on Answer Template

\`\`\`cpp
bool isValid(ll mid, const vector<ll>& a, int k) {
    // Check if target configuration is feasible with value = mid
    int required = 1;
    ll current_sum = 0;
    for (ll x : a) {
        if (x > mid) return false;
        if (current_sum + x > mid) {
            required++;
            current_sum = x;
        } else {
            current_sum += x;
        }
    }
    return required <= k;
}

ll binarySearch(const vector<ll>& a, int k) {
    ll low = *max_element(all(a)), high = 1e18, ans = high;
    while (low <= high) {
        ll mid = low + (high - low) / 2;
        if (isValid(mid, a, k)) {
            ans = mid;
            high = mid - 1; // Try finding a smaller feasible answer
        } else {
            low = mid + 1;
        }
    }
    return ans;
}
\`\`\`
`,
      },
    },
    {
      id: "sub-prefix-sliding-window",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Prefix Sums, Difference Arrays & Sliding Window",
        colorKey: "C",
        description: `### 📐 Difference Array for O(1) Range Updates

Apply $+V$ to range $[L, R]$ in $O(1)$ time, then reconstruct final array in $O(N)$.

\`\`\`cpp
vector<ll> diff(n + 2, 0);

// Perform Q range additions [L, R] with value V:
for (int q = 0; q < queries; q++) {
    diff[L] += V;
    diff[R + 1] -= V;
}

// Compute prefix sum to get final array:
vector<ll> final_arr(n + 1, 0);
for (int i = 1; i <= n; i++) {
    diff[i] += diff[i - 1];
    final_arr[i] = original[i] + diff[i];
}
\`\`\`
`,
      },
    },

    // 3. Number Theory & Mathematics
    {
      id: "number-theory-math",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Number Theory, Combinatorics & Bit Manipulation",
        category: "Mathematics",
        description: `### 🔢 Sieve, Modular Arithmetic & Bitmask Combinatorics

Compute operations modulo $10^9+7$ and iterate through bitmasks.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-modular-sieve",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Sieve of Eratosthenes & Modular Inverse",
        colorKey: "C",
        description: `### 🔢 Fast Exponentiation & Combinatorics $(nCr \\pmod M)$

\`\`\`cpp
ll binpow(ll a, ll b, ll m = MOD) {
    ll res = 1;
    a %= m;
    while (b > 0) {
        if (b & 1) res = (res * a) % m;
        a = (a * a) % m;
        b >>= 1;
    }
    return res;
}

// Modular inverse using Fermat's Little Theorem: a^(m-2) % m
ll modInverse(ll n, ll m = MOD) {
    return binpow(n, m - 2, m);
}

ll nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] * modInverse(fact[r]) % MOD * modInverse(fact[n - r]) % MOD;
}
\`\`\`
`,
      },
    },
    {
      id: "sub-combinatorics-bitmask",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Combinatorics (nCr) & Bit Manipulation",
        colorKey: "C",
        description: `### ⚙️ Bitmask Iteration Tricks

\`\`\`cpp
// 1. Iterate through all subsets of size N (0 to 2^N - 1):
for (int mask = 0; mask < (1 << n); mask++) {
    // Check if i-th bit is set:
    if (mask & (1 << i)) { ... }
}

// 2. Iterate strictly through all submasks of a given mask:
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // sub is a valid subset of mask
}
\`\`\`
`,
      },
    },

    // 4. Dynamic Programming (DP)
    {
      id: "dynamic-programming",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Dynamic Programming (DP) Mastery",
        category: "Algorithms",
        description: `### 🧠 1D/2D DP, Tree DP, Bitmask DP & Digit DP

Solve complex overlapping subproblem state transitions.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 35,
      },
    },
    {
      id: "sub-knapsack-lcs-lis",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "Classical DP: 0/1 Knapsack, LCS & LIS in O(N log N)",
        colorKey: "C",
        description: `### 📈 Longest Increasing Subsequence in $O(N \\log N)$

\`\`\`cpp
int lengthOfLIS(vector<int>& nums) {
    vector<int> tails;
    for (int x : nums) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) {
            tails.push_back(x);
        } else {
            *it = x;
        }
    }
    return tails.size();
}
\`\`\`
`,
      },
    },
    {
      id: "sub-tree-bitmask-dp",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Advanced DP: Tree DP, Bitmask DP & Digit DP",
        colorKey: "C",
        description: `### 🌲 Tree DP: Subtree Sizing & Tree Rerooting

Compute properties for every node when rooted at every single vertex in $O(N)$ total time!
`,
      },
    },

    // 5. Graph Theory & Shortest Paths
    {
      id: "graph-theory",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Graph Theory & Shortest Path Algorithms",
        category: "Graphs",
        description: `### 🌐 BFS, Dijkstra, DSU, Topological Sort & Bridges

Navigate directed, undirected, and weighted network graphs.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-traversals-dijkstra",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "BFS, DFS, Topological Sort & Dijkstra",
        colorKey: "C",
        description: `### 🛣️ Dijkstra's Shortest Path Algorithm

\`\`\`cpp
vector<ll> dijkstra(int startNode, int n, const vector<vector<pair<int, ll>>>& adj) {
    vector<ll> dist(n + 1, INF);
    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<pair<ll, int>>> pq;

    dist[startNode] = 0;
    pq.push({0, startNode});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& [v, weight] : adj[u]) {
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}
\`\`\`
`,
      },
    },
    {
      id: "sub-dsu-mst",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Disjoint Set Union (DSU) & Kruskal's MST",
        colorKey: "C",
        description: `### 🔗 Disjoint Set Union (DSU) Class Template

\`\`\`cpp
struct DSU {
    vector<int> parent, size;
    DSU(int n) : parent(n + 1), size(n + 1, 1) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int i) {
        return (parent[i] == i) ? i : (parent[i] = find(parent[i]));
    }
    bool unite(int i, int j) {
        int rootI = find(i), rootJ = find(j);
        if (rootI == rootJ) return false;
        if (size[rootI] < size[rootJ]) swap(rootI, rootJ);
        parent[rootJ] = rootI;
        size[rootI] += size[rootJ];
        return true;
    }
};
\`\`\`
`,
      },
    },

    // 6. Trees & Advanced Data Structures
    {
      id: "advanced-data-structures",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Trees & Advanced Data Structures",
        category: "Data Structures",
        description: `### 🌲 Segment Trees, Lazy Propagation, Fenwick Trees & LCA

Execute range updates and range queries in $O(\\log N)$ time.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 30,
      },
    },
    {
      id: "sub-segment-tree-lazy",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Segment Trees & Lazy Propagation",
        colorKey: "C",
        description: `### 🌳 Segment Tree with Lazy Propagation

\`\`\`cpp
struct SegmentTree {
    int n;
    vector<ll> tree, lazy;
    SegmentTree(int n) : n(n), tree(4 * n, 0), lazy(4 * n, 0) {}

    void push(int node, int start, int end) {
        if (lazy[node] != 0) {
            tree[node] += (end - start + 1) * lazy[node];
            if (start != end) {
                lazy[2 * node] += lazy[node];
                lazy[2 * node + 1] += lazy[node];
            }
            lazy[node] = 0;
        }
    }

    void updateRange(int node, int start, int end, int l, int r, ll val) {
        push(node, start, end);
        if (start > end || start > r || end < l) return;
        if (start >= l && end <= r) {
            lazy[node] += val;
            push(node, start, end);
            return;
        }
        int mid = (start + end) / 2;
        updateRange(2 * node, start, mid, l, r, val);
        updateRange(2 * node + 1, mid + 1, end, l, r, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    ll queryRange(int node, int start, int end, int l, int r) {
        push(node, start, end);
        if (start > end || start > r || end < l) return 0;
        if (start >= l && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return queryRange(2 * node, start, mid, l, r) + queryRange(2 * node + 1, mid + 1, end, l, r);
    }
};
\`\`\`
`,
      },
    },
    {
      id: "sub-fenwick-lca",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Fenwick Tree (BIT) & Lowest Common Ancestor (LCA)",
        colorKey: "C",
        description: `### 🌲 Lowest Common Ancestor via Binary Lifting

Precompute $2^k$-th ancestors to answer tree distance and LCA queries in $O(\\log N)$.
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-cp-grandmaster",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Competitive Programming Master",
        category: "Milestone",
        description: `### 🎓 Competitive Programming Mastery Attained!

Congratulations! You have mastered advanced problem solving and data structures:
- Fast C++ STL paradigms and Big-O runtime analysis.
- Binary search on answer, two pointers, and prefix sum techniques.
- Modular arithmetic, primes, and bitmask combinatorial optimizations.
- Dynamic Programming (Knapsack, LCS, LIS, Tree DP, Bitmask DP).
- Graph theory (Dijkstra, DSU, Bridges, Topological Sort).
- Advanced data structures (Segment Trees with Lazy Propagation, Fenwick Trees, LCA).
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-cp-1", source: "cpp-stl-complexity", target: "core-patterns", type: "interactive" },
    { id: "e-cp-2", source: "core-patterns", target: "number-theory-math", type: "interactive" },
    { id: "e-cp-3", source: "number-theory-math", target: "dynamic-programming", type: "interactive" },
    { id: "e-cp-4", source: "dynamic-programming", target: "graph-theory", type: "interactive" },
    { id: "e-cp-5", source: "graph-theory", target: "advanced-data-structures", type: "interactive" },
    { id: "e-cp-6", source: "advanced-data-structures", target: "milestone-cp-grandmaster", type: "interactive" },

    // Subtopics
    { id: "e-cp-sub-1", source: "cpp-stl-complexity", target: "sub-fast-io-complexity" },
    { id: "e-cp-sub-2", source: "cpp-stl-complexity", target: "sub-cpp-stl-containers" },

    { id: "e-cp-sub-3", source: "core-patterns", target: "sub-binary-search-answer" },
    { id: "e-cp-sub-4", source: "core-patterns", target: "sub-prefix-sliding-window" },

    { id: "e-cp-sub-5", source: "number-theory-math", target: "sub-modular-sieve" },
    { id: "e-cp-sub-6", source: "number-theory-math", target: "sub-combinatorics-bitmask" },

    { id: "e-cp-sub-7", source: "dynamic-programming", target: "sub-knapsack-lcs-lis" },
    { id: "e-cp-sub-8", source: "dynamic-programming", target: "sub-tree-bitmask-dp" },

    { id: "e-cp-sub-9", source: "graph-theory", target: "sub-traversals-dijkstra" },
    { id: "e-cp-sub-10", source: "graph-theory", target: "sub-dsu-mst" },

    { id: "e-cp-sub-11", source: "advanced-data-structures", target: "sub-segment-tree-lazy" },
    { id: "e-cp-sub-12", source: "advanced-data-structures", target: "sub-fenwick-lca" },
  ],
};
