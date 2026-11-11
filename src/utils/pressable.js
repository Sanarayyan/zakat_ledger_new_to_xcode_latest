// Makes a non-button element reachable and operable by keyboard and screen readers
// without changing its visual styling. Spread onto the element: <div {...pressable(fn)}>.
export function pressable(onActivate, { role = 'button', ...rest } = {}) {
    return {
        role,
        tabIndex: 0,
        onClick: onActivate,
        onKeyDown: (e) => {
            if (e.key === 'Enter' || (e.key === ' ' && role !== 'link')) {
                e.preventDefault();
                onActivate(e);
            }
        },
        ...rest,
    };
}
