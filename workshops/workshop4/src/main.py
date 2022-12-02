with open("todos.csv", "w") as f:
    for i in range(1000):
        f.write(f"todo{i}\n")
