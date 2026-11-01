import { Dropbox } from "dropbox";

const dbx = new Dropbox({
    accessToken: process.env.REACT_APP_DROPBOX_ACCESS_TOKEN
});

export default dbx;