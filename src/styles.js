export const style = (css) => css`
    /* state-badge is a fixed 40px box, which leaves an odd gap under a headered icon - let it
       shrink to the icon's natural size instead (see #425). */
    .icon-small {
        width: auto;
        height: auto;
    }
    /* ...except when it is showing a picture: state-badge then hides the icon and paints the
       image as a background, so the host has no in-flow content and would collapse to nothing.
       The class is set in renderIcon rather than reusing state-badge's own has-image. */
    .icon-small.has-picture {
        width: 40px;
        height: 40px;
    }
    .entity {
        text-align: center;
        cursor: pointer;
    }
    /* Marker for an entity id that resolves to nothing (see #364). */
    .entity .missing {
        color: var(--error-color, #db4437);
    }
    .entity span {
        font-size: 10px;
        color: var(--multiple-entity-row-header-color, var(--secondary-text-color));
    }
    .entities-row {
        flex-direction: row;
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
    }
    /* HA's name box is what pushes the entities to the right: it grows at flex: 1 1 30%. Hiding
       it removes that push too, leaving them against the icon, so take over the job here - the
       point of hiding the name is more room, not a different alignment (see #341, #365). */
    .entities-row.no-name,
    .entities-column.no-name {
        margin-left: auto;
    }
    /* The 'styles' option reaches one entity's div, which is a flex item - so vertical-align
       there does nothing and alignment has to be set on the container instead (see #261). */
    .entities-row.align-top,
    .entities-column.align-top {
        align-items: flex-start;
    }
    .entities-row.align-bottom,
    .entities-column.align-bottom {
        align-items: flex-end;
    }
    /* The 16px gap must be margin, not padding: users tune spacing with their own margins in
       the 'styles' option, which replace this margin but would stack on top of a padding - 4.10.1 did
       padding and widened every tuned row into overflowing on phones (see #432). The gap still
       has to be clickable though: the row's cursor:pointer inherits into it, but HA stops
       slotted clicks at the bare slot (catchInteraction=false), so bare margin is dead space
       that looks clickable. The ::after extension puts the gap inside the entity's hit area
       without affecting layout. position:relative on every entity keeps hit-testing fair: a
       positioned later sibling beats its neighbor's ::after wherever a user's zero/negative
       margin makes them overlap, so no entity steals its neighbor's clicks. */
    .entities-row .entity {
        margin-right: 16px;
        position: relative;
    }
    .entities-row .entity:last-of-type {
        margin-right: 0;
    }
    .entities-row .entity:not(:last-of-type)::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        right: -16px;
        width: 16px;
    }
    /* Opt-in, because it trades a taller row for not overflowing: nothing between HA's .row and
       our entities can shrink, so a row needing more width than the card has just spills past
       the edge (worst on narrow phone screens - see #411). Wrapping reflows instead. */
    .entities-row.wrap {
        flex-wrap: wrap;
        justify-content: flex-end;
        row-gap: 4px;
    }
    .entities-column {
        flex-direction: column;
        display: flex;
        align-items: flex-end;
        justify-content: space-evenly;
    }
    .entities-column .entity div {
        display: inline-block;
        vertical-align: middle;
    }
`;
