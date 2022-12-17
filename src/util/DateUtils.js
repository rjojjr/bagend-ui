import Moment from "moment";

export const getToday = () => {
    const date = new Date();
    return Moment(date).format('yyyy-MM-DD');
};
