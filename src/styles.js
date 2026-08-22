export const style = (css) => css`
    .icon-small {
        width: auto;
    }
    .entity {
        text-align: center;
        cursor: pointer;
    }
    .entity > span {
        display: block;
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
    .entities-row .entity {
        margin-right: 16px;
    }
    .entities-row .entity:last-of-type {
        margin-right: 0;
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
