export const style = (css) => css`
    :host {
        display: flex;
        align-items: center;
    }
    .flex {
        flex: 1;
        margin-left: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 0;
    }
    .info {
        flex: 1 0 60px;
        cursor: pointer;
    }
    .info,
    .info > * {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .flex ::slotted(*) {
        margin-left: 8px;
        min-width: 0;
    }
    .flex ::slotted([slot='secondary']) {
        margin-left: 0;
    }
    .secondary,
    ha-relative-time {
        display: block;
        color: var(--secondary-text-color);
    }
    hui-warning {
        width: 100%;
    }
    state-badge {
        flex: 0 0 40px;
        cursor: pointer;
    }
    .icon-small {
        width: auto;
    }
    .entity {
        text-align: center;
        cursor: pointer;
    }
    .entity span {
        font-size: 10px;
        color: var(--secondary-text-color);
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
