// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = status !== 500 ? err.message : 'Internal Server Error';
  if (status >= 500) console.error(err);
  res.status(status).send({ status, message });
};
