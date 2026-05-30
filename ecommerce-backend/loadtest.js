import http from 'k6/http';

export let options = {
  vus: 500,
  duration: '60s',
};

export default function () {
  let res = http.get('http://localhost:4000/list-All-Products-Public');
  console.log(res.status);
}