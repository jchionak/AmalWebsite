function dateFormat(myDate) {

    let month = myDate.getMonth() + 1;

    // helper function
    const addZeroIfNeeded = (num) => {
        return (num < 10) ? '0' + num : num.toString();
    }

    month = addZeroIfNeeded(month);
    let day = addZeroIfNeeded(myDate.getDate());

    let year = myDate.getFullYear();
    let hours = addZeroIfNeeded(myDate.getHours());
    let mins = addZeroIfNeeded(myDate.getMinutes());
    let seconds = addZeroIfNeeded(myDate.getSeconds());

    return `${year}-${month}-${day}T${hours}:${mins}:${seconds}`;
}

module.exports = dateFormat;