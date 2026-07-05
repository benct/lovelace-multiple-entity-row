export const style = (css) => css`
    .icon-small {
        width: auto;
    }
    .entity {
        text-align: center;
        cursor: pointer;
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
