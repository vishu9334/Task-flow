const getHealth = async (_req, res) => {
  return res.status(200).json({
    status: 'Success',
    message: 'Management server is running smoothly',
    timestamp: new Date(),
  });
};

export { getHealth };
