with open('d:/Desktop/my-anime-blog/app/components/layout/CornerNav.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 135 (index 134) - missing closing brace
lines[134] = '              transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}\n'

# Fix line 170 (index 169) - change to nav-island class
lines[169] = '          className="nav-island"\n'

with open('d:/Desktop/my-anime-blog/app/components/layout/CornerNav.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed')
