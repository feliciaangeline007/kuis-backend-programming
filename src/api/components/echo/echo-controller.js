async function echo(request, response, next) {
  try {
    return response.status(200).json({
      message: 'Echo API is working',
      method: request.method,
      path: request.originalUrl,
      query: request.query,
      body: request.body,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  echo,
};
