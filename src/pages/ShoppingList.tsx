import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClothingItem, clothingApi } from '../api/client';
import { Plus, Trash2, Edit2, Check, X, ShoppingBag, Shirt } from 'lucide-react';

const CATEGORIES = ['Футболки', 'Джинсы', 'Куртки', 'Обувь', 'Аксессуары', 'Платья', 'Рубашки', 'Шорты'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Demo data for when API is not available
const DEMO_ITEMS: ClothingItem[] = [
  { id: 1, name: 'Белая футболка', category: 'Футболки', price: 1500, size: 'M', color: 'Белый', is_bought: false, created_at: '2024-01-15' },
  { id: 2, name: 'Синие джинсы', category: 'Джинсы', price: 4500, size: 'L', color: 'Синий', is_bought: true, created_at: '2024-01-16' },
  { id: 3, name: 'Зимняя куртка', category: 'Куртки', price: 12000, size: 'L', color: 'Черный', is_bought: false, created_at: '2024-01-17' },
  { id: 4, name: 'Кроссовки Nike', category: 'Обувь', price: 8900, size: '42', color: 'Белый', is_bought: true, created_at: '2024-01-18' },
  { id: 5, name: 'Кожаный ремень', category: 'Аксессуары', price: 2500, size: 'M', color: 'Коричневый', is_bought: false, created_at: '2024-01-19' },
];

export default function ShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'bought' | 'not_bought'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [useDemo, setUseDemo] = useState(true);
  const [form, setForm] = useState({
    name: '', category: 'Футболки', price: 0, size: 'M', color: '', is_bought: false,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await clothingApi.getAll();
      setItems(data);
      setUseDemo(false);
    } catch {
      setItems(DEMO_ITEMS);
      setUseDemo(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (useDemo) {
          setItems(items.map(i => i.id === editingId ? { ...i, ...form } : i));
        } else {
          await clothingApi.update(editingId, form);
          await loadItems();
        }
        setEditingId(null);
      } else {
        if (useDemo) {
          const newItem: ClothingItem = {
            id: Math.max(...items.map(i => i.id), 0) + 1,
            ...form,
            created_at: new Date().toISOString().split('T')[0],
          };
          setItems([...items, newItem]);
        } else {
          await clothingApi.create(form);
          await loadItems();
        }
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      if (useDemo) {
        setItems(items.filter(i => i.id !== id));
      } else {
        await clothingApi.delete(id);
        await loadItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBought = async (item: ClothingItem) => {
    try {
      if (useDemo) {
        setItems(items.map(i => i.id === item.id ? { ...i, is_bought: !i.is_bought } : i));
      } else {
        await clothingApi.update(item.id, { is_bought: !item.is_bought });
        await loadItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (item: ClothingItem) => {
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      size: item.size,
      color: item.color,
      is_bought: item.is_bought,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: '', category: 'Футболки', price: 0, size: 'M', color: '', is_bought: false });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'bought' && !item.is_bought) return false;
    if (filter === 'not_bought' && item.is_bought) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    return true;
  });

  const totalPrice = filteredItems.reduce((sum, item) => sum + item.price, 0);
  const boughtCount = filteredItems.filter(i => i.is_bought).length;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-7 h-7" />
          Список покупок одежды
        </h1>
        {user && <p className="text-gray-500 text-sm mt-1">Пользователь: {user.username}</p>}
        {useDemo && (
          <p className="text-amber-600 text-xs mt-1">⚡ Демо-режим (бэкенд не подключён)</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Всего</p>
          <p className="text-xl font-bold">{filteredItems.length}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Куплено</p>
          <p className="text-xl font-bold text-green-600">{boughtCount}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Сумма</p>
          <p className="text-xl font-bold">{totalPrice.toLocaleString()} ₽</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white"
        >
          <option value="all">Все</option>
          <option value="bought">Купленные</option>
          <option value="not_bought">Не купленные</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white"
        >
          <option value="all">Все категории</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 shadow-sm border mb-4">
          <h3 className="font-medium mb-3">{editingId ? 'Редактировать' : 'Новый предмет'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Название"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
              required
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="number"
              placeholder="Цена"
              value={form.price || ''}
              onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              className="px-3 py-2 border rounded-lg text-sm"
              required
              min="0"
            />
            <select
              value={form.size}
              onChange={e => setForm({ ...form, size: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Цвет"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition">
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shirt className="w-12 h-12 mx-auto mb-2" />
            <p>Список пуст</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-lg p-3 shadow-sm border flex items-center gap-3 transition ${
                item.is_bought ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => handleToggleBought(item)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  item.is_bought ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {item.is_bought && <Check className="w-4 h-4 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${item.is_bought ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                </p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{item.category}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{item.size}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{item.color}</span>
                </div>
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{item.price.toLocaleString()} ₽</span>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
