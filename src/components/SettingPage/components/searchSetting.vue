<template>
    <el-select
      v-model="rule"
      placeholder="请选择规则"
      size="large"
      style="width: 240px"
      @change="changeSearchRule"
      no-data-text="暂无规则"
      no-match-text="暂无匹配规则"
    >
      <el-option
        v-for="item in rules"
        :key="item.name"
        :label="item.title"
        :value="item.name"
      />
    </el-select>
</template>
<script setup>
import { ref } from "vue";
import { getRuleList, matchRule } from "@/api/download.js";
const rules = ref([]);
const rule = ref("");
getRuleList({}).then((res) => {
  rules.value = res.data.rule_list;
  rule.value = res.data.used_rule.name;
});

const changeSearchRule = (e) => {
  console.log(e);
  matchRule({ rule_name: e }).then((res) => {
    console.log(res,'修改规则结果');
  });
};
</script>
