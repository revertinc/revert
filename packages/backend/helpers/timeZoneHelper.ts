const getFormattedDate = (inputDate: string) => {
    const dateObj = new Date(inputDate);

    // Extract year, month, and day
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
    const day = String(dateObj.getDate()).padStart(2, '0');

    // Format the date as "YYYY-MM-DD"
    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
};

const getDuration = (startDateTime: string, endDateTime: string) => {
    const startDate = new Date(startDateTime).getTime();
    const endDate = new Date(endDateTime).getTime();

    // Calculate the absolute difference in milliseconds
    const durationMs = Math.abs(endDate - startDate);

    // Convert milliseconds to hours and minutes
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    // Format the duration as "HH:MM"
    const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return formattedDuration;
};

const convertToHHMMInUTC = (dateTimeString: string) => {
    const date = new Date(dateTimeString);

    // Get hours and minutes in UTC format
    const hoursUTC = date.getUTCHours().toString().padStart(2, '0');
    const minutesUTC = date.getUTCMinutes().toString().padStart(2, '0');

    // Format the time as "HH:MM"
    const formattedTimeUTC = `${hoursUTC}:${minutesUTC}`;

    return formattedTimeUTC;
};

export { convertToHHMMInUTC, getDuration, getFormattedDate };
