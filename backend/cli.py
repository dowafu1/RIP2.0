#!/usr/bin/env python3
"""
Консольная команда для управления списком покупок одежды.

Использование:
    python cli.py --help
    python cli.py list
    python cli.py add --name "Футболка" --category "Футболки" --price 1500 --size M --color Белый
    python cli.py delete --id 1
    python cli.py bought --id 1
    python cli.py stats
    python cli.py users
    python cli.py create-user --username test --password test123
"""

import argparse
import sys
from database import engine, SessionLocal, Base
from models import User, ClothingItem, ChatMessage
from auth import get_password_hash

# Ensure tables exist
Base.metadata.create_all(bind=engine)


def list_items(args):
    """Вывести все предметы одежды"""
    db = SessionLocal()
    items = db.query(ClothingItem).all()

    if not items:
        print("📦 Список пуст")
        db.close()
        return

    print(f"\n{'ID':<4} {'Название':<25} {'Категория':<12} {'Цена':<10} {'Размер':<6} {'Цвет':<12} {'Куплено':<8}")
    print("-" * 85)
    for item in items:
        bought = "✅" if item.is_bought else "❌"
        print(f"{item.id:<4} {item.name:<25} {item.category:<12} {item.price:<10.0f} {item.size:<6} {item.color:<12} {bought}")

    total = sum(i.price for i in items if not i.is_bought)
    print(f"\n💰 Общая сумма некупленного: {total:.0f} ₽")
    db.close()


def add_item(args):
    """Добавить предмет одежды"""
    db = SessionLocal()

    # Find user (use first user or create default)
    user = db.query(User).first()
    if not user:
        print("⚠️  Нет пользователей. Создайте пользователя: python cli.py create-user --username admin --password admin")
        db.close()
        return

    item = ClothingItem(
        user_id=user.id,
        name=args.name,
        category=args.category or "Другое",
        price=args.price or 0,
        size=args.size or "M",
        color=args.color or "",
        is_bought=False,
    )
    db.add(item)
    db.commit()
    print(f"✅ Добавлено: {item.name} ({item.category}, {item.price} ₽)")
    db.close()


def delete_item(args):
    """Удалить предмет одежды"""
    db = SessionLocal()
    item = db.query(ClothingItem).filter(ClothingItem.id == args.id).first()
    if not item:
        print(f"❌ Предмет с ID {args.id} не найден")
        db.close()
        return

    db.delete(item)
    db.commit()
    print(f"🗑️  Удалено: {item.name}")
    db.close()


def mark_bought(args):
    """Отметить предмет как купленный"""
    db = SessionLocal()
    item = db.query(ClothingItem).filter(ClothingItem.id == args.id).first()
    if not item:
        print(f"❌ Предмет с ID {args.id} не найден")
        db.close()
        return

    item.is_bought = not item.is_bought
    db.commit()
    status = "куплено ✅" if item.is_bought else "не куплено ❌"
    print(f"📝 {item.name}: {status}")
    db.close()


def show_stats(args):
    """Показать статистику"""
    db = SessionLocal()
    items = db.query(ClothingItem).all()
    total = len(items)
    bought = sum(1 for i in items if i.is_bought)
    not_bought = total - bought
    total_price = sum(i.price for i in items)
    bought_price = sum(i.price for i in items if i.is_bought)

    print(f"\n📊 Статистика покупок:")
    print(f"   Всего предметов: {total}")
    print(f"   Куплено: {bought}")
    print(f"   Не куплено: {not_bought}")
    print(f"   Общая сумма: {total_price:.0f} ₽")
    print(f"   Потрачено: {bought_price:.0f} ₽")
    print(f"   Осталось: {total_price - bought_price:.0f} ₽")

    # By category
    categories = {}
    for item in items:
        if item.category not in categories:
            categories[item.category] = {"count": 0, "price": 0}
        categories[item.category]["count"] += 1
        categories[item.category]["price"] += item.price

    if categories:
        print(f"\n📂 По категориям:")
        for cat, data in sorted(categories.items()):
            print(f"   {cat}: {data['count']} шт. ({data['price']:.0f} ₽)")

    db.close()


def list_users(args):
    """Показать всех пользователей"""
    db = SessionLocal()
    users = db.query(User).all()

    if not users:
        print("👤 Нет пользователей")
        db.close()
        return

    print(f"\n{'ID':<4} {'Имя пользователя':<20} {'Дата создания'}")
    print("-" * 45)
    for user in users:
        print(f"{user.id:<4} {user.username:<20} {user.created_at}")
    db.close()


def create_user(args):
    """Создать нового пользователя"""
    db = SessionLocal()
    existing = db.query(User).filter(User.username == args.username).first()
    if existing:
        print(f"❌ Пользователь '{args.username}' уже существует")
        db.close()
        return

    user = User(
        username=args.username,
        hashed_password=get_password_hash(args.password)
    )
    db.add(user)
    db.commit()
    print(f"✅ Пользователь '{args.username}' создан")
    db.close()


def main():
    parser = argparse.ArgumentParser(
        description="🛍️  Гардероб - Консольное управление списком покупок одежды"
    )
    subparsers = parser.add_subparsers(dest="command", help="Команды")

    # list
    subparsers.add_parser("list", help="Показать все предметы")

    # add
    add_parser = subparsers.add_parser("add", help="Добавить предмет")
    add_parser.add_argument("--name", required=True, help="Название")
    add_parser.add_argument("--category", help="Категория")
    add_parser.add_argument("--price", type=float, help="Цена")
    add_parser.add_argument("--size", help="Размер")
    add_parser.add_argument("--color", help="Цвет")

    # delete
    del_parser = subparsers.add_parser("delete", help="Удалить предмет")
    del_parser.add_argument("--id", type=int, required=True, help="ID предмета")

    # bought
    bought_parser = subparsers.add_parser("bought", help="Отметить как купленный/не купленный")
    bought_parser.add_argument("--id", type=int, required=True, help="ID предмета")

    # stats
    subparsers.add_parser("stats", help="Показать статистику")

    # users
    subparsers.add_parser("users", help="Показать пользователей")

    # create-user
    user_parser = subparsers.add_parser("create-user", help="Создать пользователя")
    user_parser.add_argument("--username", required=True, help="Имя пользователя")
    user_parser.add_argument("--password", required=True, help="Пароль")

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    commands = {
        "list": list_items,
        "add": add_item,
        "delete": delete_item,
        "bought": mark_bought,
        "stats": show_stats,
        "users": list_users,
        "create-user": create_user,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
