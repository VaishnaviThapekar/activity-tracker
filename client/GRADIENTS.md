# Gradient Styles Guide

## 🎨 Available Gradient Utilities

### 1. **Primary Gradient** (Cyan → Purple)

```html
<!-- Background Gradient -->
<div class="gradient-primary">Content</div>

<!-- Text Gradient -->
<span class="gradient-primary-text">Gradient Text</span>

<!-- Tailwind Classes -->
<div class="bg-gradient-to-r from-cyan-500 to-purple-500">Background</div>
<span
  class="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent"
  >Text</span
>
```

### 2. **Gradient Border with Glow**

```html
<!-- Button with Gradient Border -->
<button class="gradient-border-glow bg-black text-white px-6 py-2 rounded-full">
  Hover Me
</button>
```

### 3. **Animated Gradient**

```html
<div class="gradient-animated h-32 rounded-lg"></div>
```

### 4. **Gradient Button** (Like Reference)

```html
<button class="btn-gradient">
  <span>Start Free Trial</span>
</button>
```

### 5. **Card with Gradient Border**

```html
<div class="card-gradient">
  <h3>Card Content</h3>
</div>
```

### 6. **Glow Effects**

```html
<div class="glow-cyan">Cyan Glow</div>
<div class="glow-purple">Purple Glow</div>
<div class="glow-gradient">Combined Glow</div>
```

### 7. **Badge/Tag**

```html
<span class="badge-gradient">New Feature</span>
```

### 8. **Progress Bar**

```html
<div class="w-full bg-gray-200 rounded-full h-2">
  <div class="progress-gradient" style="width: 75%"></div>
</div>
```

## 📦 Usage in Components

### Example: Enhanced Button

```jsx
<Button className="relative group">
  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg opacity-75 group-hover:opacity-100 blur"></div>
  <span className="relative">Click Me</span>
</Button>
```

### Example: Card Header

```jsx
<CardTitle className="gradient-primary-text">Live Progress</CardTitle>
```

### Example: Progress Ring

```jsx
<div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
  {summary.completion_rate}%
</div>
```

## 🎯 Key Colors

- **Cyan**: `#06b6d4` (cyan-500)
- **Purple**: `#a855f7` (purple-500)
- **Pink**: `#ec4899` (pink-500) - for 3-color gradients

## ⚡ Quick Apply to Activity Tracker

1. **Add Task Button** - Use `btn-gradient`
2. **Progress Cards** - Use `card-gradient`
3. **Completion % Text** - Use `gradient-primary-text`
4. **Duration Badges** - Use `badge-gradient`
5. **Progress Bars** - Use `progress-gradient`
