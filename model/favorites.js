module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Favorites', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    command: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    alias: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true
    }
  }, {
    tableName: 'favorites',
    timestamps: true
  });
};