import Sequelize, { Model } from 'sequelize';

class Plan extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        duration: Sequelize.INTEGER,
        price: Sequelize.FLOAT,
      },
      { sequelize }
    );
  }

  calculateTotalPrice() {
    return this.price * this.duration;
  }
}

export default Plan;
