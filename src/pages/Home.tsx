import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Map,
  Wallet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { motion } from "motion/react";

export default function Home() {
  const [stats, setStats] = useState({
    products: 0,
    spots: 0,
    loans: 0,
  });

  useEffect(() => {
    // Fetch quick stats
    const fetchStats = async () => {
      try {
        const [pRes, tRes, lRes] = await Promise.all([
          api.get("/products?size=1"),
          api.get("/tourism/spots?size=1"),
          api.get("/finance/loan-products?size=1"),
        ]);
        setStats({
          products: pRes.data?.data?.total || 0,
          spots: tRes.data?.data?.total || 0,
          loans: lRes.data?.data?.total || 0,
        });
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      title: "农产品交易",
      description: "优质农产品直供，助力农户增收，让消费者买到放心好货。",
      icon: ShoppingBag,
      color: "bg-orange-100 text-orange-600",
      link: "/products",
      count: stats.products,
      unit: "件商品在售",
    },
    {
      title: "乡村旅游推广",
      description: "发现美丽乡村，体验农家乐、采摘园，预订特色民宿。",
      icon: Map,
      color: "bg-blue-100 text-blue-600",
      link: "/tourism",
      count: stats.spots,
      unit: "个热门景点",
    },
    {
      title: "农村金融服务",
      description: "提供助农贷款、农业保险，解决农业生产资金难题。",
      icon: Wallet,
      color: "bg-green-100 text-green-600",
      link: "/finance",
      count: stats.loans,
      unit: "款金融产品",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-green-600 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/farm/1920/1080')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-bold leading-tight"
            >
              数字赋能乡村振兴
              <br />
              共筑美丽富裕新农村
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-green-100 text-lg md:text-xl max-w-xl"
            >
              集农产品交易、乡村旅游、金融服务于一体的综合性管理平台，助力农业现代化发展。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-4 flex flex-wrap gap-4"
            >
              <Link
                to="/products"
                className="bg-white text-green-600 px-6 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors shadow-sm"
              >
                去逛逛农产品
              </Link>
              <Link
                to="/tourism"
                className="bg-green-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors border border-green-500 shadow-sm"
              >
                探索乡村游
              </Link>
            </motion.div>
          </div>
          <div className="hidden lg:flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
              <Sprout className="w-8 h-8 mx-auto mb-2 text-green-200" />
              <div className="text-2xl font-bold">科学种植</div>
              <div className="text-sm text-green-200 mt-1">数据分析指导</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center mt-8">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-200" />
              <div className="text-2xl font-bold">增收致富</div>
              <div className="text-sm text-green-200 mt-1">拓宽销售渠道</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">核心服务</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 mb-6 min-h-[48px]">
                {feature.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="text-sm font-medium text-gray-900">
                  <span className="text-lg font-bold mr-1">
                    {feature.count}
                  </span>
                  <span className="text-gray-500">{feature.unit}</span>
                </div>
                <Link
                  to={feature.link}
                  className="flex items-center text-sm font-medium text-green-600 group-hover:text-green-700"
                >
                  进入模块{" "}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">品质保障</h4>
            <p className="text-sm text-gray-500">
              所有农产品均经过严格审核，产地直发，确保新鲜安全。
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Map className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">真实体验</h4>
            <p className="text-sm text-gray-500">
              乡村旅游景点实地考察，真实用户评价，拒绝虚假宣传。
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">安全金融</h4>
            <p className="text-sm text-gray-500">
              联合正规金融机构，提供低息贷款与农业保险，保障生产。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
