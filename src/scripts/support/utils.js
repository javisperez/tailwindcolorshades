// We need to sanitize the name of the color now as we support dynamic color name
// which may contain spaces
export const sanitizeColorName = (name) => {
    return name.replace(/\s/g, '-').toLowerCase();
};
