module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Batch', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    command: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    cwd: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    undone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'batches',
    timestamps: true
  });
};