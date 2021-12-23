// Source: https://github.com/home-assistant/frontend/blob/dev/src/common/datetime/format_time.ts

import memoizeOne from 'memoize-one';
import { useAmPm } from './use_am_pm';

export const formatTime = (dateObj, locale) => formatTimeMem(locale).format(dateObj);

const formatTimeMem = memoizeOne(
    (locale) =>
        new Intl.DateTimeFormat(locale.language, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: useAmPm(locale),
        })
);
