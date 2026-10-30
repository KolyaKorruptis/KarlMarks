// apply the color mode mirrored in localStorage before the first paint
document.documentElement.dataset.theme = localStorage.colorMode || 'system'
